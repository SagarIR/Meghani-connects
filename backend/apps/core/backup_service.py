"""
Database Backup Service
"""
import os
import json
import gzip
import shutil
from datetime import datetime
from io import BytesIO
from django.conf import settings
from django.core.management import call_command
from django.apps import apps


class BackupService:
    """
    Service to create and manage database backups.
    """
    
    BACKUP_DIR = os.path.join(settings.BASE_DIR, 'backups')
    
    def __init__(self):
        # Ensure backup directory exists
        os.makedirs(self.BACKUP_DIR, exist_ok=True)
    
    def create_backup(self, user=None):
        """
        Create a full database backup.
        
        Returns:
            dict with backup details
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'backup_{timestamp}.json.gz'
        filepath = os.path.join(self.BACKUP_DIR, filename)
        
        try:
            # Create JSON dump
            output = BytesIO()
            call_command(
                'dumpdata',
                '--natural-foreign',
                '--natural-primary',
                '--exclude=auth.permission',
                '--exclude=contenttypes',
                '--exclude=admin.logentry',
                '--exclude=sessions.session',
                '--indent=2',
                stdout=output
            )
            
            # Compress and save
            with gzip.open(filepath, 'wb') as f:
                f.write(output.getvalue().encode('utf-8'))
            
            # Get file size
            file_size = os.path.getsize(filepath)
            
            # Create backup metadata
            metadata = {
                'filename': filename,
                'filepath': filepath,
                'timestamp': timestamp,
                'created_at': datetime.now().isoformat(),
                'created_by': user.username if user else 'system',
                'size_bytes': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2)
            }
            
            # Save metadata
            self._save_metadata(metadata)
            
            return {
                'success': True,
                'backup': metadata
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_backups(self):
        """
        List all available backups.
        
        Returns:
            list of backup metadata dicts
        """
        backups = []
        metadata_file = os.path.join(self.BACKUP_DIR, 'metadata.json')
        
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    backups = json.load(f)
            except:
                pass
        
        # Also scan for files without metadata
        for filename in os.listdir(self.BACKUP_DIR):
            if filename.startswith('backup_') and filename.endswith('.json.gz'):
                # Check if already in metadata
                if not any(b['filename'] == filename for b in backups):
                    filepath = os.path.join(self.BACKUP_DIR, filename)
                    timestamp = filename.replace('backup_', '').replace('.json.gz', '')
                    backups.append({
                        'filename': filename,
                        'filepath': filepath,
                        'timestamp': timestamp,
                        'created_at': datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                        'size_bytes': os.path.getsize(filepath),
                        'size_mb': round(os.path.getsize(filepath) / (1024 * 1024), 2)
                    })
        
        # Sort by timestamp descending
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return backups
    
    def get_backup(self, filename):
        """
        Get backup file path and metadata.
        
        Returns:
            tuple of (filepath, metadata) or None
        """
        filepath = os.path.join(self.BACKUP_DIR, filename)
        
        if not os.path.exists(filepath):
            return None, None
        
        # Find metadata
        backups = self.list_backups()
        metadata = next((b for b in backups if b['filename'] == filename), None)
        
        return filepath, metadata
    
    def restore_backup(self, filename, user=None):
        """
        Restore database from backup.
        
        WARNING: This will overwrite all existing data!
        
        Returns:
            dict with restore status
        """
        filepath, metadata = self.get_backup(filename)
        
        if not filepath:
            return {
                'success': False,
                'error': 'Backup file not found'
            }
        
        try:
            # Create a backup before restoring (safety)
            pre_restore_backup = self.create_backup(user)
            
            # Read and decompress backup
            with gzip.open(filepath, 'rb') as f:
                data = f.read().decode('utf-8')
            
            # Load data using Django's loaddata
            # Write to temp file first
            temp_file = os.path.join(self.BACKUP_DIR, 'temp_restore.json')
            with open(temp_file, 'w') as f:
                f.write(data)
            
            try:
                call_command('loaddata', temp_file, verbosity=0)
            finally:
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            
            return {
                'success': True,
                'restored_from': filename,
                'pre_restore_backup': pre_restore_backup.get('backup', {}).get('filename')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_backup(self, filename):
        """
        Delete a backup file.
        
        Returns:
            dict with delete status
        """
        filepath, metadata = self.get_backup(filename)
        
        if not filepath:
            return {
                'success': False,
                'error': 'Backup file not found'
            }
        
        try:
            os.remove(filepath)
            
            # Update metadata
            backups = self.list_backups()
            backups = [b for b in backups if b['filename'] != filename]
            self._save_all_metadata(backups)
            
            return {
                'success': True,
                'deleted': filename
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup_old_backups(self, keep_count=10):
        """
        Delete old backups, keeping only the most recent ones.
        
        Returns:
            dict with cleanup status
        """
        backups = self.list_backups()
        
        if len(backups) <= keep_count:
            return {
                'success': True,
                'deleted': 0,
                'message': 'No backups to clean up'
            }
        
        # Delete oldest backups
        to_delete = backups[keep_count:]
        deleted = 0
        
        for backup in to_delete:
            result = self.delete_backup(backup['filename'])
            if result['success']:
                deleted += 1
        
        return {
            'success': True,
            'deleted': deleted,
            'remaining': keep_count
        }
    
    def _save_metadata(self, metadata):
        """Save backup metadata to metadata file."""
        backups = self.list_backups()
        
        # Remove existing entry if exists
        backups = [b for b in backups if b['filename'] != metadata['filename']]
        
        # Add new entry
        backups.append(metadata)
        
        self._save_all_metadata(backups)
    
    def _save_all_metadata(self, backups):
        """Save all backup metadata to file."""
        metadata_file = os.path.join(self.BACKUP_DIR, 'metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(backups, f, indent=2)
