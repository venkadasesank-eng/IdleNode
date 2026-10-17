import os
import re
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from backend.app.models.entities import FileItem

STORAGE_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
MAX_PERSISTENT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB

def sanitize_filename(filename: str) -> str:
    # Remove path traversal characters
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', clean)
    if not clean or clean.startswith('.'):
        clean = f"file_{clean}"
    return clean

def get_user_storage_path(user_id: str, storage_type: str = "persistent") -> str:
    user_dir = os.path.join(STORAGE_BASE, storage_type, user_id)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def list_user_files(db: Session, user_id: str, storage_type: Optional[str] = None) -> List[FileItem]:
    query = db.query(FileItem).filter(FileItem.user_id == user_id)
    if storage_type:
        query = query.filter(FileItem.storage_type == storage_type)
    return query.order_by(FileItem.created_at.desc()).all()

def save_user_file(db: Session, user_id: str, filename: str, content: bytes, storage_type: str = "persistent", session_id: Optional[str] = None) -> FileItem:
    clean_name = sanitize_filename(filename)
    user_dir = get_user_storage_path(user_id, storage_type)
    
    # Check quota for persistent storage
    if storage_type == "persistent":
        current_used = sum(f.size_bytes for f in db.query(FileItem).filter(FileItem.user_id == user_id, FileItem.storage_type == "persistent").all())
        if current_used + len(content) > MAX_PERSISTENT_QUOTA_BYTES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Persistent storage quota (5GB) exceeded")

    safe_path = os.path.join(user_dir, clean_name)
    with open(safe_path, "wb") as f:
        f.write(content)

    file_item = FileItem(
        user_id=user_id,
        session_id=session_id,
        filename=clean_name,
        safe_path=safe_path,
        size_bytes=len(content),
        storage_type=storage_type
    )
    db.add(file_item)
    db.commit()
    db.refresh(file_item)
    return file_item

def delete_user_file(db: Session, file_id: str, user_id: str):
    file_item = db.query(FileItem).filter(FileItem.id == file_id, FileItem.user_id == user_id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or access denied")
    
    if os.path.exists(file_item.safe_path):
        try:
            os.remove(file_item.safe_path)
        except Exception:
            pass
            
    db.delete(file_item)
    db.commit()
