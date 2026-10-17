from datetime import datetime, timezone
import zoneinfo
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.entities import CreditAccount, CreditTransaction

def get_current_date_in_tz() -> str:
    try:
        tz = zoneinfo.ZoneInfo(settings.TIMEZONE)
    except Exception:
        tz = timezone.utc
    now = datetime.now(tz)
    return now.strftime("%Y-%m-%d")

def get_or_create_credit_account(db: Session, user_id: str) -> CreditAccount:
    account = db.query(CreditAccount).filter(CreditAccount.user_id == user_id).first()
    today_str = get_current_date_in_tz()
    
    if not account:
        account = CreditAccount(
            user_id=user_id,
            daily_allowance=settings.DAILY_CREDIT_ALLOWANCE,
            current_balance=settings.DAILY_CREDIT_ALLOWANCE,
            reserved_credits=0,
            last_reset_date=today_str
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        
        # Initial grant transaction
        tx = CreditTransaction(
            account_id=account.id,
            amount=settings.DAILY_CREDIT_ALLOWANCE,
            balance_after=settings.DAILY_CREDIT_ALLOWANCE,
            reason="Initial daily credit allowance grant"
        )
        db.add(tx)
        db.commit()
        return account

    # Check for daily reset: Unused credits expire, reset to allowance
    if account.last_reset_date != today_str:
        account.last_reset_date = today_str
        account.current_balance = account.daily_allowance
        account.reserved_credits = 0 # reset any stale reservations
        
        tx = CreditTransaction(
            account_id=account.id,
            amount=account.daily_allowance,
            balance_after=account.daily_allowance,
            reason=f"Daily credit reset for {today_str} (unused credits expired)"
        )
        db.add(tx)
        db.commit()
        db.refresh(account)

    return account

def get_workload_rate(workload_type: str) -> int:
    rates = {
        "general": settings.RATE_GENERAL_DESKTOP,
        "development": settings.RATE_DEV_CPU,
        "data_science": settings.RATE_DATA_SCIENCE,
        "ml_gpu": settings.RATE_ML_GPU,
        "simulation": settings.RATE_SIMULATION,
    }
    return rates.get(workload_type.lower(), settings.RATE_GENERAL_DESKTOP)

def reserve_credits(db: Session, account: CreditAccount, amount: int, reason: str, session_id: str) -> bool:
    if account.current_balance - account.reserved_credits < amount:
        return False
    account.reserved_credits += amount
    db.commit()
    return True

def release_credits(db: Session, account: CreditAccount, amount: int):
    account.reserved_credits = max(0, account.reserved_credits - amount)
    db.commit()

def charge_credits(db: Session, account: CreditAccount, amount: int, reason: str, session_id: str):
    account.reserved_credits = max(0, account.reserved_credits - amount)
    account.current_balance = max(0, account.current_balance - amount)
    
    tx = CreditTransaction(
        account_id=account.id,
        amount=-amount,
        balance_after=account.current_balance,
        reason=reason,
        session_id=session_id
    )
    db.add(tx)
    db.commit()
