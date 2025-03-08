document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('submission-form');
    const statusDiv = document.getElementById('submission-status');
    const submissionList = document.getElementById('submission-list');
    const teacherView = document.getElementById('teacher-view');
    const headerContainer = document.querySelector('.container h1');
    const confirmBtn = document.getElementById('confirm-student-info-btn');
    const studentInfoModal = document.getElementById('student-info-modal');
    const saveStudentInfoBtn = document.getElementById('save-student-info');

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Check if student info exists for current user
    const studentInfoKey = `studentInfo_${currentUser.id}`;
    const studentInfo = JSON.parse(localStorage.getItem(studentInfoKey) || '{}');

    // If info doesn't exist, show the modal to fill it
    if (!studentInfo.name || !studentInfo.class) {
        if (studentInfoModal) {
            studentInfoModal.classList.remove('info-hidden');

            // Save student info
            if (saveStudentInfoBtn) {
                saveStudentInfoBtn.addEventListener('click', function() {
                    const name = document.getElementById('student-name-input').value.trim();
                    const className = document.getElementById('student-class-input').value.trim();

                    if (!name || !className) {
                        alert('Vui lòng nhập đầy đủ thông tin học sinh(giáo viên).');
                        return;
                    }

                    // Save student info
                    localStorage.setItem(studentInfoKey, JSON.stringify({
                        name: name,
                        class: className,
                        locked: true,
                        lastEditedBy: currentUser.username,
                        lastEditedAt: new Date().toLocaleString('vi-VN')
                    }));

                    studentInfoModal.classList.add('info-hidden');
                    location.reload(); // Reload to update the UI
                });
            }
        }
    }

    // Add user info and logout button
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <span>Xin chào, <strong>${currentUser.username}</strong></span>
        <button id="logout-btn">Đăng xuất</button>
    `;

    // Add "Edit Student Information" button if user has permissions
    if (currentUser.isAdmin || currentUser.permissions.includes('edit_info') || currentUser.permissions.includes('unlock_info')) {
        const editStudentInfoBtn = document.createElement('button');
        editStudentInfoBtn.id = 'edit-student-info-btn';
        editStudentInfoBtn.textContent = 'Sửa đổi thông tinh học sinh';
        editStudentInfoBtn.style.marginLeft = '10px';
        editStudentInfoBtn.style.backgroundColor = '#17a2b8'; // Info blue color
        editStudentInfoBtn.addEventListener('click', function() {
            window.location.href = 'edit-permissions.html';
        });
        userInfo.appendChild(editStudentInfoBtn);
    }

    // Add "Manage User Permissions" button for admins
    if (currentUser.isAdmin) {
        const managePermissionsBtn = document.createElement('button');
        managePermissionsBtn.id = 'manage-permissions-btn';
        managePermissionsBtn.textContent = 'Quản lý quyền người dùng';
        managePermissionsBtn.style.marginLeft = '10px';
        managePermissionsBtn.style.backgroundColor = '#6610f2'; // Purple color
        managePermissionsBtn.addEventListener('click', function() {
            window.location.href = 'admin-panel.html';
        });
        userInfo.appendChild(managePermissionsBtn);
    }

    // Insert user info above header
    headerContainer.parentNode.insertBefore(userInfo, headerContainer);

    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    let submissions = JSON.parse(localStorage.getItem('submissions') || '[]');

    if (currentUser.isAdmin || currentUser.permissions.includes('view')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Xem danh sách bài nộp';
        toggleBtn.style.marginTop = '20px';
        toggleBtn.style.backgroundColor = '#6c757d';
        document.querySelector('.container').appendChild(toggleBtn);

        toggleBtn.addEventListener('click', function() {
            if (teacherView.style.display === 'none') {
                teacherView.style.display = 'block';
                toggleBtn.textContent = 'Ẩn danh sách bài nộp';
            } else {
                teacherView.style.display = 'none';
                toggleBtn.textContent = 'Xem danh sách bài nộp';
            }
        });
    }

    if (currentUser.isAdmin || currentUser.permissions.includes('view')) {
        renderSubmissions();
    }

    // Display student info if it exists
    const studentInfoForDisplay = JSON.parse(localStorage.getItem(`studentInfo_${currentUser.id}`) || '{}');
    if (studentInfoForDisplay.name && studentInfoForDisplay.class) {
        displayStudentInfo(studentInfoForDisplay);
    }

    // Function to display student info in the UI
    function displayStudentInfo(studentInfo) {
        // Remove existing student info display if present
        const existingInfo = document.getElementById('student-info-display');
        if (existingInfo) {
            existingInfo.remove();
        }

        // Hide original student info inputs
        const studentInfoSection = document.querySelector('.student-info-section');
        if (studentInfoSection) {
            studentInfoSection.style.display = 'none';
        }

        // Create new info display
        const infoDisplay = document.createElement('div');
        infoDisplay.id = 'student-info-display';
        infoDisplay.className = 'locked-info';
        infoDisplay.innerHTML = `
            <p><strong>Tên học sinh:</strong> ${studentInfo.name}</p>
            <p><strong>Lớp:</strong> ${studentInfo.class}</p>
            <p><small>Đã cập nhật lần cuối: ${studentInfo.lastEditedAt || 'N/A'}</small></p>
        `;

        // Add edit button only for admins
        if (currentUser.isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Chỉnh sửa thông tin';
            editBtn.className = 'edit-btn';
            editBtn.addEventListener('click', function() {
                editStudentInfo(studentInfo);
            });
            infoDisplay.appendChild(editBtn);
        }

        // Insert the info display before the assignment title field
        const assignmentLabel = document.querySelector('label[for="assignment-title"]');
        form.insertBefore(infoDisplay, assignmentLabel);
    }

    // Function for admins to edit student info
    function editStudentInfo(studentInfo) {
        // Only allow admins to edit
        if (!currentUser.isAdmin) {
            showStatus('Bạn không có quyền chỉnh sửa thông tin học sinh.', 'error');
            return;
        }

        // Create edit modal
        const editModal = document.createElement('div');
        editModal.className = 'modal';
        editModal.innerHTML = `
            <div class="modal-content">
                <h3>Chỉnh sửa thông tin học sinh</h3>
                <div class="form-group">
                    <label for="edit-name">Tên học sinh:</label>
                    <input type="text" id="edit-name" value="${studentInfo.name || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-class">Lớp:</label>
                    <input type="text" id="edit-class" value="${studentInfo.class || ''}">
                </div>
                <div class="button-group">
                    <button id="save-edit-btn" class="view-btn">Lưu thay đổi</button>
                    <button id="cancel-edit-btn" class="delete-btn">Hủy</button>
                </div>
            </div>
        `;

        document.body.appendChild(editModal);

        // Handle save button
        document.getElementById('save-edit-btn').addEventListener('click', function() {
            const newName = document.getElementById('edit-name').value.trim();
            const newClass = document.getElementById('edit-class').value.trim();

            if (!newName || !newClass) {
                alert('Vui lòng nhập đầy đủ thông tin.');
                return;
            }

            // Update student info
            const updatedInfo = {
                ...studentInfo,
                name: newName,
                class: newClass,
                lastEditedBy: currentUser.username,
                lastEditedAt: new Date().toLocaleString('vi-VN')
            };

            localStorage.setItem(`studentInfo_${currentUser.id}`, JSON.stringify(updatedInfo));
            document.body.removeChild(editModal);
            displayStudentInfo(updatedInfo);
            showStatus('Đã cập nhật thông tin học sinh.', 'success');
        });

        // Handle cancel button
        document.getElementById('cancel-edit-btn').addEventListener('click', function() {
            document.body.removeChild(editModal);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const studentName = document.getElementById('student-name').value;
        const studentClass = document.getElementById('student-class').value;
        const assignmentTitle = document.getElementById('assignment-title').value;
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];

        if (!file) {
            showStatus('Vui lòng chọn một tệp để nộp.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const submission = {
                id: Date.now().toString(),
                studentName: studentName,
                studentClass: studentClass,
                assignmentTitle: assignmentTitle,
                fileName: file.name,
                fileType: file.type,
                fileSize: formatFileSize(file.size),
                fileData: event.target.result,
                submittedAt: new Date().toLocaleString('vi-VN'),
                submittedBy: currentUser.username
            };

            submissions.push(submission);
            localStorage.setItem('submissions', JSON.stringify(submissions));

            if (currentUser.isAdmin || currentUser.permissions.includes('view')) {
                renderSubmissions();
            }

            showStatus(`Bài tập "${assignmentTitle}" đã được nộp thành công!`, 'success');
            form.reset();
        };

        reader.onerror = function() {
            showStatus('Có lỗi xảy ra khi đọc tệp. Vui lòng thử lại.', 'error');
        };

        reader.readAsDataURL(file);
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 5000);
    }

    function renderSubmissions() {
        submissionList.innerHTML = '';

        if (submissions.length === 0) {
            submissionList.innerHTML = '<li>Chưa có bài nộp nào.</li>';
            return;
        }

        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        submissions.forEach(submission => {
            const li = document.createElement('li');

            const submissionInfo = document.createElement('div');
            submissionInfo.className = 'submission-info';
            submissionInfo.innerHTML = `
                <div>
                    <strong>${submission.studentName}</strong> - Lớp: ${submission.studentClass || 'N/A'} - ${submission.assignmentTitle}
                    <br>
                    <small>Tên tệp: ${submission.fileName} (${submission.fileSize})</small>
                    <br>
                    <small>Nộp lúc: ${submission.submittedAt}</small>
                    ${submission.submittedBy ? `<br><small>Người nộp: ${submission.submittedBy}</small>` : ''}
                </div>
            `;

            const actionDiv = document.createElement('div');
            actionDiv.className = 'submission-actions';

            if (currentUser.isAdmin || currentUser.permissions.includes('view')) {
                const viewBtn = document.createElement('button');
                viewBtn.className = 'view-btn';
                viewBtn.textContent = 'Xem';
                viewBtn.addEventListener('click', function() {
                    viewSubmission(submission);
                });
                actionDiv.appendChild(viewBtn);
            }

            if (currentUser.isAdmin || currentUser.permissions.includes('download')) {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = 'Tải xuống';
                downloadBtn.addEventListener('click', function() {
                    downloadSubmission(submission);
                });
                actionDiv.appendChild(downloadBtn);
            }

            if (currentUser.isAdmin || currentUser.permissions.includes('delete')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Xóa';
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`Bạn có chắc chắn muốn xóa bài nộp "${submission.assignmentTitle}" của học sinh "${submission.studentName}"?`)) {
                        deleteSubmission(submission.id);
                    }
                });
                actionDiv.appendChild(deleteBtn);
            }

            li.appendChild(submissionInfo);
            li.appendChild(actionDiv);
            submissionList.appendChild(li);
        });
    }


    function viewSubmission(submission) {
        if (submission.fileType.startsWith('text/') || 
            submission.fileType === 'application/pdf' ||
            submission.fileType.includes('image/')) {

            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
            modal.style.zIndex = '1000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';

            const content = document.createElement('div');
            content.style.backgroundColor = 'white';
            content.style.padding = '20px';
            content.style.borderRadius = '5px';
            content.style.maxWidth = '80%';
            content.style.maxHeight = '80%';
            content.style.overflow = 'auto';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Đóng';
            closeBtn.style.display = 'block';
            closeBtn.style.marginTop = '10px';
            closeBtn.style.padding = '5px 10px';
            closeBtn.style.backgroundColor = '#6c757d';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '3px';
            closeBtn.style.cursor = 'pointer';

            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });

            const fileHeader = document.createElement('h3');
            fileHeader.textContent = `${submission.fileName} - Nộp bởi: ${submission.studentName}`;
            content.appendChild(fileHeader);

            if (submission.fileType.includes('image/')) {
                const img = document.createElement('img');
                img.src = submission.fileData;
                img.style.maxWidth = '100%';
                content.appendChild(img);
            } else if (submission.fileType === 'application/pdf') {
                const iframe = document.createElement('iframe');
                iframe.src = submission.fileData;
                iframe.style.width = '100%';
                iframe.style.height = '500px';
                content.appendChild(iframe);
            } else if (submission.fileType.startsWith('text/')) {
                fetch(submission.fileData)
                    .then(response => response.text())
                    .then(text => {
                        const pre = document.createElement('pre');
                        pre.style.whiteSpace = 'pre-wrap';
                        pre.style.wordBreak = 'break-word';
                        pre.style.maxWidth = '100%';
                        pre.style.overflow = 'auto';
                        pre.textContent = text;
                        content.appendChild(pre);
                    })
                    .catch(error => {
                        content.innerHTML += '<p>Không thể hiển thị nội dung tệp. Vui lòng tải xuống để xem.</p>';
                    });
            } else {
                content.innerHTML += '<p>Không thể hiển thị nội dung tệp. Vui lòng tải xuống để xem.</p>';
            }

            content.appendChild(closeBtn);
            modal.appendChild(content);
            document.body.appendChild(modal);
        } else {
            downloadSubmission(submission);
        }
    }

    function downloadSubmission(submission) {
        const link = document.createElement('a');
        link.href = submission.fileData;
        link.download = submission.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function deleteSubmission(id) {
        submissions = submissions.filter(sub => sub.id !== id);
        localStorage.setItem('submissions', JSON.stringify(submissions));
        renderSubmissions();
        showStatus('Bài nộp đã được xóa thành công.', 'success');
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        }
    }
});
