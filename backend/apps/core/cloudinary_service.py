import os
import time
import hashlib
import json
import logging
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


class CloudinaryMediaService:
    """
    Secure Cloudinary media service.
    Handles image uploads to Cloudinary when credentials are configured.
    Falls back gracefully to local media storage if Cloudinary is not configured.
    Never exposes API secrets to client-side code.
    """

    def __init__(self):
        self.cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME') or getattr(settings, 'CLOUDINARY_CLOUD_NAME', None)
        self.api_key = os.getenv('CLOUDINARY_API_KEY') or getattr(settings, 'CLOUDINARY_API_KEY', None)
        self.api_secret = os.getenv('CLOUDINARY_API_SECRET') or getattr(settings, 'CLOUDINARY_API_SECRET', None)
        self.default_folder = os.getenv('CLOUDINARY_FOLDER', 'meghani-watches')

    @property
    def is_configured(self) -> bool:
        return bool(self.cloud_name and self.api_key and self.api_secret)

    def _generate_signature(self, params: dict) -> str:
        """
        Generate SHA-1 signature for Cloudinary authentication.
        Sort parameters alphabetically and concatenate with api_secret.
        """
        sorted_pairs = [f"{k}={v}" for k, v in sorted(params.items()) if v is not None]
        serialized_string = "&".join(sorted_pairs) + self.api_secret
        return hashlib.sha1(serialized_string.encode('utf-8')).hexdigest()

    def upload_image(self, file_obj, folder: str = None) -> dict:
        """
        Upload an image file.
        Returns:
            {
                "url": str,
                "public_id": str,
                "provider": "cloudinary" | "local",
                "success": bool
            }
        """
        target_folder = folder or self.default_folder

        # If Cloudinary is configured, upload to Cloudinary API
        if self.is_configured:
            try:
                timestamp = int(time.time())
                params = {
                    'folder': target_folder,
                    'timestamp': timestamp,
                }
                signature = self._generate_signature(params)

                url = f"https://api.cloudinary.com/v1_1/{self.cloud_name}/image/upload"
                
                # Prepare multipart boundary
                boundary = f"----WebKitFormBoundary{hashlib.md5(str(time.time()).encode()).hexdigest()}"
                
                file_bytes = file_obj.read() if hasattr(file_obj, 'read') else file_obj
                filename = getattr(file_obj, 'name', 'watch_media.jpg')

                body = []
                # Add text fields
                for key, val in [('api_key', self.api_key), ('timestamp', str(timestamp)),
                                 ('folder', target_folder), ('signature', signature)]:
                    body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{val}\r\n")

                # Add file field
                content_type = getattr(file_obj, 'content_type', 'image/jpeg')
                body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n")

                payload = "".join(body).encode('latin1') + file_bytes + f"\r\n--{boundary}--\r\n".encode('latin1')

                req = Request(url, data=payload)
                req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

                with urlopen(req, timeout=10) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    secure_url = res_data.get('secure_url') or res_data.get('url')
                    return {
                        'success': True,
                        'url': secure_url,
                        'public_id': res_data.get('public_id'),
                        'provider': 'cloudinary',
                        'format': res_data.get('format'),
                        'width': res_data.get('width'),
                        'height': res_data.get('height')
                    }
            except Exception as e:
                logger.warning(f"Cloudinary upload failed ({e}), falling back to local storage.")

        # Fallback: Save to Django local media storage
        try:
            filename = getattr(file_obj, 'name', f"watch_{int(time.time())}.jpg")
            clean_filename = os.path.basename(filename)
            rel_path = f"products/{int(time.time())}_{clean_filename}"
            
            # Ensure media directories exist
            media_root = str(settings.MEDIA_ROOT)
            os.makedirs(os.path.join(media_root, 'products'), exist_ok=True)
            
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            
            saved_path = default_storage.save(rel_path, file_obj)
            media_url = settings.MEDIA_URL + saved_path
            
            return {
                'success': True,
                'url': media_url,
                'public_id': rel_path,
                'provider': 'local',
            }
        except Exception as e:
            logger.error(f"Local storage save failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'provider': 'none'
            }
