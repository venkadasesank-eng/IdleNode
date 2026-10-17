import os
import sys
import shutil
import pytest

# Add worker-agent src to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from agent import WorkerAgent

def test_worker_telemetry():
    agent = WorkerAgent(safe_identifier="NODE-TEST-01")
    telemetry = agent.get_system_telemetry()
    assert telemetry["safe_identifier"] == "NODE-TEST-01"
    assert telemetry["cpu_percent"] >= 0.0
    assert telemetry["ram_percent"] >= 0.0
    assert "agent_version" in telemetry

def test_worker_sandbox_isolation_and_cleanup():
    test_sandbox = "./test_sandbox_dir"
    agent = WorkerAgent(safe_identifier="NODE-TEST-01", workspace_sandbox_dir=test_sandbox)
    
    # Prepare sandbox
    session_id = "test-session-123"
    s_dir = agent.prepare_session_sandbox(session_id)
    assert os.path.exists(s_dir)
    assert agent.active_session_id == session_id

    # Create dummy student file inside
    dummy_file = os.path.join(s_dir, "code.py")
    with open(dummy_file, "w") as f:
        f.write("print('Hello from IdleNode')")
    assert os.path.exists(dummy_file)

    # Cleanup sandbox
    agent.cleanup_session_sandbox(session_id)
    assert not os.path.exists(s_dir)
    assert agent.active_session_id is None

    # Teardown
    if os.path.exists(test_sandbox):
        shutil.rmtree(test_sandbox)
