import shutil
import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "static/uploads"

class LocalFileManager:
    @staticmethod
    async def save_file(file: UploadFile) -> str:
        # 1. Generate unique filename to prevent overwrites
        file_ext = file.filename.split(".")[-1]
        unique_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        
        # 2. Stream content to disk (Low memory usage)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Return the relative path for the DB
        return file_path

    @staticmethod
    def delete_file(file_path: str):
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass # Log error in production