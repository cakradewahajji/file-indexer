let allFiles = {
    images: [],
    documents: [],
    videos: [],
    messages: [],
    others: []
  };
  
  function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = show ? 'block' : 'none';
  }
  
  async function fetchDeviceInfo() {
    showLoading(true);
    try {
      const response = await fetch('/device-info');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const deviceInfo = await response.json();
      document.getElementById('device-name').textContent = deviceInfo.name;
      document.getElementById('device-os').textContent = deviceInfo.os;
      document.getElementById('device-storage').textContent = `Total: ${deviceInfo.storage.total}, Used: ${deviceInfo.storage.used}, Available: ${deviceInfo.storage.available}`;
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      showLoading(false);
    }
  }
  
  async function fetchFiles() {
    showLoading(true);
    try {
      const response = await fetch('/files');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      allFiles = await response.json();
      console.log('Data received:', allFiles); // Log received data
      showAll(); // Show all files by default
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      showLoading(false);
    }
  }
  
  function showCategory(category) {
    const files = allFiles[category] || [];
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear existing items
    if (files.length === 0) {
      const div = document.createElement('div');
      div.className = 'text-center';
      div.textContent = 'No files found in this category.';
      fileList.appendChild(div);
      return;
    }
    files.forEach(file => {
      const div = document.createElement('div');
      div.className = 'file-list-item';
      div.innerHTML = `
        <i class="fas fa-file-alt file-icon"></i>
        <div class="file-details">
          <div class="file-path">${file.path.replace(/^\/sdcard\//, '')}</div>
          <div class="file-info">Last Modified: ${file.timestamp}</div>
        </div>
        ${getPreviewButton(file.path)}
      `;
      fileList.appendChild(div);
    });
  }
  
  function getPreviewButton(filePath) {
    if (filePath.match(/\.(jpg|jpeg|png|gif|mp4|mkv|avi|pdf|docx|txt)$/i)) {
      return `<button class="btn btn-primary btn-sm" onclick="previewFile('${filePath}')">Preview</button>`;
    }
    return '';
  }
  
  function showAll() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear existing items
    let hasFiles = false;
    Object.keys(allFiles).forEach(category => {
      const files = allFiles[category];
      if (files.length > 0) {
        hasFiles = true;
        files.forEach(file => {
          const div = document.createElement('div');
          div.className = 'file-list-item';
          div.innerHTML = `
            <i class="fas fa-file-alt file-icon"></i>
            <div class="file-details">
              <div class="file-path">${file.path.replace(/^\/sdcard\//, '')}</div>
              <div class="file-info">Last Modified: ${file.timestamp}</div>
            </div>
            ${getPreviewButton(file.path)}
          `;
          fileList.appendChild(div);
        });
      }
    });
    if (!hasFiles) {
      const div = document.createElement('div');
      div.className = 'text-center';
      div.textContent = 'No files found.';
      fileList.appendChild(div);
    }
  }
  
  function previewFile(filePath) {
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = ''; // Clear previous content
  
    const encodedPath = encodeURIComponent(filePath);
  
    if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
      // Preview image
      previewContent.innerHTML = `<img src="/files/file?path=${encodedPath}" class="file-preview" alt="Image Preview">`;
    } else if (filePath.match(/\.(mp4|mkv|avi)$/i)) {
      // Preview video
      previewContent.innerHTML = `
        <video controls class="file-preview">
          <source src="/files/file?path=${encodedPath}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else if (filePath.match(/\.(pdf|docx|txt)$/i)) {
      // Preview document
      previewContent.innerHTML = `<iframe src="/files/file?path=${encodedPath}" class="file-preview" frameborder="0"></iframe>`;
    } else {
      previewContent.innerHTML = '<p>No preview available for this file type.</p>';
    }
  
    // Show the modal
    $('#previewModal').modal('show');
  }
  
  // Fetch device info and files on page load
  window.onload = function() {
    fetchDeviceInfo();
    fetchFiles();
  };
  