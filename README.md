# ComfyUI-Usgromana-Gallery

A comprehensive image gallery extension for ComfyUI that provides advanced image management, metadata editing, NSFW content filtering, and real-time file monitoring capabilities.

## Overview

ComfyUI-Usgromana-Gallery transforms ComfyUI's output directory into an interactive, feature-rich image gallery. It offers a modern web-based interface for browsing, organizing, rating, and managing generated images with support for user permissions, content filtering, and extensive metadata management.

### Key Capabilities

- **Image Gallery Viewing**: Browse all images in your ComfyUI output directory with thumbnails and full-screen viewing
- **Metadata Management**: View and edit comprehensive image metadata including prompts, workflow data, generation parameters, and custom tags
- **Rating System**: Rate images with a 5-star system that persists across sessions
- **NSFW Content Filtering**: Integrates with ComfyUI-Usgromana NSFW API to automatically filter content based on user permissions
- **File Management**: Rename and delete images directly from the gallery interface
- **Real-time Updates**: Automatically detects and displays new images as they are generated
- **Batch Operations**: Download or delete multiple images at once
- **Advanced Viewing**: Zoom and pan functionality for detailed image inspection

---

## Features

### 1. Image Gallery Grid

The main gallery view displays all images from your ComfyUI output directory in a responsive grid layout.

**Features:**
- Thumbnail grid with configurable sizes (small, medium, large)
- Star ratings displayed on each image (when enabled)
- Click any image to open the detailed view
- Search functionality to filter images by filename, model, or prompt
- Rating filter to show only images above a certain rating threshold
- Real-time updates when new images are generated

**How to Use:**
1. Click the gallery button in ComfyUI's action bar to open the gallery
2. Browse images in the grid view
3. Use the search bar to find specific images
4. Adjust the rating filter slider to show only highly-rated images
5. Click any image thumbnail to view it in detail

### 2. Detailed Image View

The detailed view provides a full-screen experience for viewing and managing individual images.

**Features:**
- Full-resolution image display
- Side thumbnails for previous/next navigation
- Keyboard navigation (Arrow keys, Escape)
- Zoom and drag mode for detailed inspection
- Quick action buttons (metadata, open in new tab, zoom, close)

**How to Use:**
1. Click an image in the grid to open the detailed view
2. Use arrow keys or click side thumbnails to navigate between images
3. Click the "+" button to enable zoom mode, then:
   - Use mouse wheel to zoom in/out
   - Click and drag to pan when zoomed in
4. Press Escape or click the "✖" button to close

### 3. Metadata Panel

The metadata panel displays comprehensive information about each image and allows editing for authorized users.

**Displayed Information:**
- **File Information**: Width, height, format, MIME type, file size, modification date
- **Generation Parameters**: Steps, CFG scale, seed, sampler, scheduler, model
- **Prompts**: Positive prompt, negative prompt, full prompt
- **Workflow Data**: Complete workflow JSON (if available)
- **User Metadata**: Rating (1-5 stars), tags (as colored pills), display name
- **NSFW Status**: Content warning badge if image is marked as NSFW

**How to Use:**
1. Open an image in the detailed view
2. Click the "ⓘ" button to open the metadata panel
3. View all available metadata
4. For admins: Click the pencil icon next to editable fields to modify them
5. Press Enter to save changes, Escape to cancel

### 4. Rating System

Rate images with a 1-5 star system that persists across sessions.

**Features:**
- Click stars directly on grid images to set rating
- Click stars in the metadata panel to set rating
- Ratings are stored in both metadata files and image EXIF data
- Filter images by minimum rating threshold
- Ratings sync between grid and metadata views

**How to Use:**
1. Click the star rating on any image (grid or metadata panel)
2. The rating is saved automatically
3. Use the rating filter slider to show only images above a certain rating
4. Ratings are visible in both the grid overlay and metadata panel

### 5. Tagging System

Add and manage tags for organizing your images.

**Features:**
- Add multiple tags per image (comma-separated)
- Tags displayed as colored pills in the metadata panel
- Tags stored in image metadata and JSON files
- Tags written to image EXIF data for Windows Properties compatibility

**How to Use:**
1. Open the metadata panel for an image
2. Click the pencil icon next to "Tags"
3. Enter tags separated by commas (e.g., "portrait, high-quality, anime")
4. Press Enter to save
5. Tags will appear as colored pills below the field

### 6. NSFW Content Filtering

Automatic content filtering based on user permissions and NSFW detection.

**Features:**
- Integrates with ComfyUI-Usgromana NSFW API
- Automatically detects NSFW content in images
- Filters images based on user permissions (admin, authenticated, guest)
- Manual NSFW tagging available for admins
- Content warning badges in metadata panel
- Respects user's SFW enforcement settings

**How to Use:**
- **Automatic**: NSFW filtering happens automatically based on your user account
- **Manual Tagging** (Admin only):
  1. Open the metadata panel for an image
  2. Click the "Mark as NSFW" button
  3. Confirm the action
  4. The image will be tagged and filtered accordingly

**Requirements:**
- ComfyUI-Usgromana extension must be installed
- NSFW API must be available and properly configured
- User permissions must be set up in ComfyUI-Usgromana

### 7. File Management

Rename and delete images directly from the gallery interface.

**Rename Files (Admin only):**
1. Open the metadata panel for an image
2. Click the pencil icon next to "File"
3. Enter the new filename (without extension)
4. Press Enter to save
5. The file will be renamed and metadata updated automatically

**Delete Files (Admin only):**
1. Open the metadata panel for an image
2. Scroll to the bottom of the metadata panel
3. Click the "🗑️ Delete Image" button
4. Confirm the deletion
5. The image will be permanently deleted from the server

**Note**: Both rename and delete operations are only available to administrators.

### 8. Zoom and Drag Mode

Inspect images in detail with zoom and pan functionality.

**Features:**
- Zoom range: 0.5x to 5.0x
- Mouse wheel zoom toward cursor position
- Click and drag to pan when zoomed in
- Smooth transitions and visual feedback
- Automatically resets when switching images or closing the view

**How to Use:**
1. Open an image in the detailed view
2. Click the "+" button in the top-right corner
3. Use mouse wheel to zoom in/out (zooms toward cursor position)
4. When zoomed in, click and drag to pan around the image
5. Click "+" again to disable zoom mode

### 9. Batch Operations

Perform operations on multiple images at once.

**Batch Download:**
1. Select multiple images using Ctrl/Cmd+Click
2. Click the batch download button
3. All selected images will be downloaded as a ZIP file

**Batch Delete (Admin only):**
1. Select multiple images using Ctrl/Cmd+Click
2. Click the batch delete button
3. Confirm the deletion
4. All selected images will be permanently deleted

### 10. Settings and Configuration

Customize the gallery behavior through the settings panel.

**Available Settings:**
- **Theme**: Dark or light mode
- **Thumbnail Size**: Small, medium, or large
- **Show Rating in Grid**: Toggle star rating overlay on grid images
- **Enable Drag**: Allow dragging images from the grid
- **Show Dividers**: Group images by folder, date, or alphabetically
- **Sort By**: Name, time, size, or pixels
- **File Extensions**: Configure which image formats to display
- **Real-time Updates**: Enable/disable automatic file monitoring

**How to Access:**
1. Open the gallery
2. Click the settings/gear icon
3. Adjust settings as desired
4. Settings are saved automatically

### 11. Real-time File Monitoring

Automatically detect and display new images as they are generated.

**Features:**
- Watches the output directory for new files
- Automatically adds new images to the gallery
- Supports both native file system events and polling fallback
- Configurable file extensions to monitor

**Requirements:**
- `watchdog` Python package (optional but recommended)
- If watchdog is not available, polling mode is used automatically

**Installation:**
```bash
pip install watchdog
```

---

## Advanced Features and Requirements

### Admin-Only Features

Several features require administrator privileges - ComfyUI-Usgromana extension must be installed:

**Admin Features:**
- Edit metadata fields (filename, display name, tags, prompts, parameters)
- Rename image files
- Delete images (single or batch)
- Mark images as NSFW manually

**How to Become Admin:**
- Your user account must have `is_admin: true` in ComfyUI-Usgromana user configuration
- OR your user must be in the "admin" group
- OR your user must have `can_edit: true` permission

**Checking Admin Status:**
- If you see pencil icons next to fields in the metadata panel, you have admin access
- If fields are read-only and no pencil icons appear, you do not have admin access

### NSFW API Integration

The gallery integrates with ComfyUI-Usgromana's NSFW API for content filtering.

**Requirements:**
1. ComfyUI-Usgromana extension must be installed
2. NSFW API must be available and properly configured
3. User permissions must be set up in ComfyUI-Usgromana

**What It Does:**
- Automatically detects NSFW content in images
- Filters images based on user permissions
- Blocks NSFW images for users with SFW restrictions
- Allows manual NSFW tagging for administrators
- Displays content warnings in the metadata panel

**If NSFW API is Not Available:**
- Gallery will still function normally
- NSFW filtering will be disabled
- All images will be visible to all users
- Manual NSFW tagging will not be available

### Metadata Persistence

Metadata is stored in multiple locations for reliability:

**Storage Locations:**
1. **JSON Files** (in extension's `data` directory):
   - `metadata.json`: User-edited metadata (tags, display names, ratings)
   - `ratings.json`: Legacy ratings storage (merged with metadata)
   - `settings.json`: Gallery settings

2. **Image Files** (embedded in image metadata):
   - PNG text chunks: Rating, Tags, Title, NSFW status
   - XMP metadata: For Windows Properties compatibility
   - EXIF data: Where supported

**Benefits:**
- Metadata survives file moves (if using relpath)
- Visible in Windows File Properties
- Compatible with other image management tools
- Redundant storage ensures data safety

---

## Troubleshooting

### Gallery Not Loading

**Symptoms**: Gallery button doesn't appear or clicking it does nothing.

**Solutions:**
1. Check browser console for JavaScript errors (F12)
2. Verify the extension is properly installed in `custom_nodes/ComfyUI-Usgromana-Gallery`
3. Restart ComfyUI server
4. Clear browser cache and reload the page
5. Check that `__init__.py` is loading without errors in the ComfyUI console

### Images Not Appearing

**Symptoms**: Gallery opens but shows no images.

**Solutions:**
1. Verify images exist in ComfyUI's output directory
2. Check that file extensions match your settings (default: .png, .jpg, .jpeg, .webp, .gif, .bmp)
3. Check browser console for API errors
4. Verify the output directory path is correct
5. Try refreshing the gallery (close and reopen)

### NSFW Filtering Not Working

**Symptoms**: NSFW images visible to users who shouldn't see them, or all images blocked.

**Solutions:**
1. Verify ComfyUI-Usgromana extension is installed
2. Check that NSFW API is available (look for "[Usgromana-Gallery] NSFW API available" in console)
3. Verify user permissions in ComfyUI-Usgromana configuration
4. Check console for NSFW API errors
5. If API is not available, filtering is disabled (expected behavior)

### Metadata Not Saving

**Symptoms**: Changes to metadata don't persist after closing the gallery.

**Solutions:**
1. Verify you have admin permissions (check for pencil icons)
2. Check browser console for API errors
3. Verify the `data` directory exists and is writable
4. Check ComfyUI console for backend errors
5. Try saving again - some fields may require admin access

### Ratings Not Showing

**Symptoms**: Star ratings don't appear on grid images.

**Solutions:**
1. Check gallery settings - ensure "Show rating overlay in grid" is enabled
2. Verify ratings are being saved (check metadata panel)
3. Refresh the gallery
4. Check that `ratings.json` or metadata contains rating data

### Real-time Updates Not Working

**Symptoms**: New images don't appear automatically.

**Solutions:**
1. Check settings - ensure "Enable real-time updates" is enabled
2. Install `watchdog` package: `pip install watchdog`
3. If watchdog is not available, polling mode should work automatically
4. Try manually refreshing the gallery
5. Check ComfyUI console for file monitoring errors

### Performance Issues

**Symptoms**: Gallery is slow to load or navigate.

**Solutions:**
1. Reduce thumbnail size in settings
2. Disable real-time updates if not needed
3. Use rating/search filters to reduce visible images
4. Check for large numbers of images (consider organizing into subfolders)
5. NSFW checks are cached - first load may be slower

### Admin Features Not Available

**Symptoms**: Can't edit metadata, rename files, or delete images.

**Solutions:**
1. Verify your user account has admin privileges in ComfyUI-Usgromana
2. Check that `is_admin: true` or `can_edit: true` is set in your user configuration
3. Verify you're logged in (not a guest user)
4. Check browser console for permission errors
5. Restart ComfyUI server after changing user permissions

### Metadata Panel Not Opening

**Symptoms**: Clicking metadata button does nothing or panel doesn't appear.

**Solutions:**
1. Check browser console for JavaScript errors
2. Try closing and reopening the detailed view
3. Verify the image has loaded completely
4. Check that metadata API endpoint is responding (check Network tab)
5. Refresh the page and try again

### Zoom/Drag Mode Not Working

**Symptoms**: "+" button doesn't enable zoom or drag doesn't work.

**Solutions:**
1. Ensure you've clicked the "+" button to enable zoom mode (button should highlight)
2. Try scrolling the mouse wheel over the image
3. Ensure you're zoomed in (>1.0x) before trying to drag
4. Check browser console for JavaScript errors
5. Try disabling and re-enabling zoom mode

---

## Installation

1. Clone or download this repository into your ComfyUI `custom_nodes` directory:
   ```
   cd ComfyUI/custom_nodes
   git clone <repository-url> ComfyUI-Usgromana-Gallery
   ```

2. Install optional dependencies (recommended for real-time file monitoring):
   ```bash
   pip install watchdog
   ```

3. Restart ComfyUI server

4. The gallery button should appear in ComfyUI's action bar

---

## Requirements

### Required
- ComfyUI (latest version)
- Python 3.8+
- PIL/Pillow (usually included with ComfyUI)

### Optional but Recommended
- `watchdog>=3.0.0` - For efficient real-time file monitoring
- ComfyUI-Usgromana extension - For NSFW content filtering

### For Advanced Features
- **Admin Access**: Requires ComfyUI-Usgromana user configuration with admin privileges
- **NSFW Filtering**: Requires ComfyUI-Usgromana extension with NSFW API enabled

---

## Data Storage

All gallery data is stored in the extension's own directory structure:

```
ComfyUI-Usgromana-Gallery/
├── data/
│   ├── metadata.json    # User-edited metadata
│   ├── ratings.json     # Legacy ratings (merged with metadata)
│   └── settings.json    # Gallery settings
```

**Note**: Data files are stored separately from image files to keep the output directory clean. Metadata is also embedded in image files for portability.

---

## Keyboard Shortcuts

- **Arrow Left/Right**: Navigate between images in detailed view
- **Escape**: Close detailed view or metadata panel
- **Enter**: Save changes when editing metadata fields
- **Escape** (while editing): Cancel changes to metadata fields

---

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Modern browsers with JavaScript ES6+ support required.

---

## Support and Contributing

For issues, feature requests, or contributions, please refer to the project repository.

---

## License

[Add your license information here]

