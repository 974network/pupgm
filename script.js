// حالة التطبيق
const state = {
    tasks: [],
    notificationPermission: false,
    autoNotifications: true,
    soundEnabled: true,
    theme: 'light',
    customSounds: {},
    currentPlayingSound: null
};

// متغيرات عالمية
let currentSoundFile = null;
let extendTaskId = null;
let isSoundPlaying = false;

// عناصر DOM
const DOM = {
    // العناصر الأساسية
    taskForm: document.getElementById('taskForm'),
    tasksList: document.getElementById('tasksList'),
    notificationBtn: document.getElementById('notificationBtn'),
    notificationStatus: document.getElementById('notificationStatus'),
    activeTasks: document.getElementById('activeTasks'),
    completedTasks: document.getElementById('completedTasks'),
    todayTasks: document.getElementById('todayTasks'),
    notificationPopup: document.getElementById('notificationPopup'),
    popupTitle: document.getElementById('popupTitle'),
    popupMessage: document.getElementById('popupMessage'),
    popupClose: document.getElementById('popupClose'),
    soundPlayer: document.getElementById('notificationSoundPlayer'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    clearSoundsBtn: document.getElementById('clearSoundsBtn'),
    autoNotifications: document.getElementById('autoNotifications'),
    soundEnabled: document.getElementById('soundEnabled'),
    themeSelect: document.getElementById('themeSelect'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    storageInfo: document.getElementById('storageInfo'),
    
    // نافذة التمديد
    extendPopup: document.getElementById('extendPopup'),
    extendConfirm: document.getElementById('extendConfirm'),
    extendCancel: document.getElementById('extendCancel'),
    extendOptions: document.querySelectorAll('input[name="extendTime"]'),
    customMinutes: document.getElementById('customMinutes'),
    extendCustom: document.getElementById('extendCustom'),
    
    // عناصر الصوت
    soundUpload: document.getElementById('soundUpload'),
    chooseSoundBtn: document.getElementById('chooseSoundBtn'),
    playSoundBtn: document.getElementById('playSoundBtn'),
    stopSoundBtn: document.getElementById('stopSoundBtn'),
    removeSoundBtn: document.getElementById('removeSoundBtn'),
    selectedSoundName: document.getElementById('selectedSoundName'),
    soundPreview: document.getElementById('soundPreview'),
    
    // حقول النموذج
    taskName: document.getElementById('taskName'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime')
};

// تهيئة التطبيق
function init() {
    loadState();
    loadCustomSounds();
    renderTasks();
    setupEventListeners();
    setupSoundUpload();
    checkNotifications();
    startTaskChecker();
    updateStats();
    updateStorageInfo();
    
    // تعيين الوقت الافتراضي
    setDefaultTimes();
}

// تحميل الحالة من localStorage
function loadState() {
    // تحميل الإعدادات
    const savedState = localStorage.getItem('appState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.autoNotifications = parsed.autoNotifications ?? true;
        state.soundEnabled = parsed.soundEnabled ?? true;
        state.theme = parsed.theme ?? 'light';
    }
    
    DOM.autoNotifications.checked = state.autoNotifications;
    DOM.soundEnabled.checked = state.soundEnabled;
    DOM.themeSelect.value = state.theme;
    setTheme(state.theme);
    
    // تحميل المهام مع تحويل التواريخ
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        try {
            const tasks = JSON.parse(savedTasks);
            // تحويل تواريخ JSON إلى كائنات Date
            state.tasks = tasks.map(task => ({
                ...task,
                startTime: new Date(task.startTime),
                endTime: new Date(task.endTime),
                createdAt: new Date(task.createdAt)
            }));
        } catch (error) {
            console.error('خطأ في تحميل المهام:', error);
            state.tasks = [];
        }
    } else {
        state.tasks = [];
    }
}

// تحميل الأصوات المخصصة
function loadCustomSounds() {
    try {
        const sounds = localStorage.getItem('customSounds');
        if (sounds) {
            state.customSounds = JSON.parse(sounds);
        } else {
            state.customSounds = {};
        }
    } catch (error) {
        console.error('خطأ في تحميل الأصوات:', error);
        state.customSounds = {};
    }
}

// حفظ الأصوات المخصصة
function saveCustomSounds() {
    try {
        localStorage.setItem('customSounds', JSON.stringify(state.customSounds));
        updateStorageInfo();
    } catch (error) {
        console.error('خطأ في حفظ الأصوات:', error);
        if (error.name === 'QuotaExceededError') {
            alert('تم تجاوز سعة التخزين. حاول حذف بعض النغمات.');
        }
    }
}

// حفظ الحالة
function saveState() {
    localStorage.setItem('appState', JSON.stringify({
        autoNotifications: state.autoNotifications,
        soundEnabled: state.soundEnabled,
        theme: state.theme
    }));
}

// حفظ المهام
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
        updateStorageInfo();
    } catch (error) {
        console.error('خطأ في حفظ المهام:', error);
        if (error.name === 'QuotaExceededError') {
            alert('تم تجاوز سعة التخزين. حاول حذف بعض المهام.');
        }
    }
}

// تحديث معلومات التخزين
function updateStorageInfo() {
    let totalSize = 0;
    
    try {
        // حساب حجم المهام
        const tasksJson = JSON.stringify(state.tasks);
        totalSize += new TextEncoder().encode(tasksJson).length;
        
        // حساب حجم الأصوات
        const soundsJson = JSON.stringify(state.customSounds);
        totalSize += new TextEncoder().encode(soundsJson).length;
        
        // تحويل للكيلوبايت
        const sizeInKB = (totalSize / 1024).toFixed(2);
        DOM.storageInfo.textContent = `${sizeInKB} KB`;
        
        // تحذير إذا تجاوز 4MB
        if (totalSize > 4 * 1024 * 1024) {
            DOM.storageInfo.style.color = 'var(--danger-color)';
            DOM.storageInfo.innerHTML += ' ⚠️';
        } else if (totalSize > 2 * 1024 * 1024) {
            DOM.storageInfo.style.color = 'var(--warning-color)';
        } else {
            DOM.storageInfo.style.color = 'var(--success-color)';
        }
    } catch (error) {
        console.error('خطأ في حساب المساحة:', error);
        DOM.storageInfo.textContent = 'غير متاح';
    }
}

// تعيين الوقت الافتراضي
function setDefaultTimes() {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60000);
    
    DOM.startTime.value = formatDateTimeInput(now);
    DOM.endTime.value = formatDateTimeInput(nextHour);
}

// تنسيق التاريخ للعنصر input[type="datetime-local"]
function formatDateTimeInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// تفعيل الإشعارات
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("المتصفح لا يدعم الإشعارات");
        return;
    }
    
    if (Notification.permission === "granted") {
        state.notificationPermission = true;
        updateNotificationUI();
        showNotification('تم التفعيل!', 'سيتم إرسال إشعارات للمهام');
        return;
    }
    
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            state.notificationPermission = permission === "granted";
            updateNotificationUI();
            if (state.notificationPermission) {
                showNotification('مرحباً!', 'تم تفعيل الإشعارات بنجاح');
            }
        });
    }
}

// تحديث واجهة الإشعارات
function updateNotificationUI() {
    if (state.notificationPermission) {
        DOM.notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i><span>تعطيل الإشعارات</span>';
        DOM.notificationStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>الإشعارات مفعلة</span>';
        DOM.notificationStatus.style.color = '#4cc9f0';
    } else {
        DOM.notificationBtn.innerHTML = '<i class="fas fa-bell"></i><span>تفعيل الإشعارات</span>';
        DOM.notificationStatus.innerHTML = '<i class="fas fa-times-circle"></i><span>الإشعارات غير مفعلة</span>';
        DOM.notificationStatus.style.color = '#f72585';
    }
}

// إعداد تحميل الصوت
function setupSoundUpload() {
    // فتح نافذة اختيار الملف
    DOM.chooseSoundBtn.addEventListener('click', () => {
        DOM.soundUpload.click();
    });

    // عند اختيار ملف
    DOM.soundUpload.addEventListener('change', handleSoundFileSelect);

    // تشغيل النغمة
    DOM.playSoundBtn.addEventListener('click', handlePlaySound);

    // إيقاف النغمة
    DOM.stopSoundBtn.addEventListener('click', stopCurrentSound);

    // إزالة النغمة
    DOM.removeSoundBtn.addEventListener('click', handleRemoveSound);

    // عند إيقاف التشغيل تلقائياً
    DOM.soundPreview.addEventListener('ended', () => {
        isSoundPlaying = false;
        DOM.playSoundBtn.innerHTML = '<i class="fas fa-play"></i> استمع';
        DOM.playSoundBtn.classList.remove('sound-playing');
        DOM.stopSoundBtn.disabled = true;
    });
    
    // تحديث خيار التمديد المخصص
    DOM.extendCustom.addEventListener('change', function() {
        DOM.customMinutes.disabled = !this.checked;
        if (this.checked) {
            DOM.customMinutes.focus();
        }
    });
    
    DOM.extendOptions.forEach(option => {
        if (option.value !== 'custom') {
            option.addEventListener('change', function() {
                if (this.checked) {
                    DOM.customMinutes.disabled = true;
                }
            });
        }
    });
}

// معالجة اختيار ملف الصوت
function handleSoundFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من حجم الملف (حد أقصى 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف كبير جداً! الرجاء اختيار ملف أقل من 5MB');
        DOM.soundUpload.value = '';
        return;
    }

    // التحقق من نوع الملف
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/mp3', 'audio/x-m4a', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
        alert('نوع الملف غير مدعوم! الرجاء اختيار ملف صوتي (MP3, WAV, OGG, M4A)');
        DOM.soundUpload.value = '';
        return;
    }

    currentSoundFile = file;
    DOM.selectedSoundName.textContent = file.name;
    DOM.selectedSoundName.style.color = 'var(--primary-color)';
    DOM.playSoundBtn.disabled = false;
    DOM.stopSoundBtn.disabled = true;
    DOM.removeSoundBtn.disabled = false;

    // إنشاء رابط تشغيل
    const objectURL = URL.createObjectURL(file);
    DOM.soundPreview.src = objectURL;
    DOM.soundPreview._objectURL = objectURL;
}

// معالجة تشغيل الصوت
function handlePlaySound() {
    if (DOM.soundPreview.src && DOM.soundPreview.src !== '') {
        stopCurrentSound(); // إيقاف أي صوت شغال
        
        DOM.soundPreview.currentTime = 0;
        DOM.soundPreview.play()
            .then(() => {
                isSoundPlaying = true;
                DOM.playSoundBtn.innerHTML = '<i class="fas fa-pause"></i> استمع';
                DOM.playSoundBtn.classList.add('sound-playing');
                DOM.stopSoundBtn.disabled = false;
            })
            .catch(e => {
                console.error('خطأ في تشغيل الصوت:', e);
                alert('تعذر تشغيل النغمة. تأكد من دعم المتصفح لنوع الملف.');
            });
    }
}

// إيقاف الصوت الحالي
function stopCurrentSound() {
    if (state.currentPlayingSound) {
        state.currentPlayingSound.pause();
        state.currentPlayingSound.currentTime = 0;
        state.currentPlayingSound = null;
    }
    
    if (DOM.soundPreview) {
        DOM.soundPreview.pause();
        DOM.soundPreview.currentTime = 0;
        isSoundPlaying = false;
        DOM.playSoundBtn.innerHTML = '<i class="fas fa-play"></i> استمع';
        DOM.playSoundBtn.classList.remove('sound-playing');
        DOM.stopSoundBtn.disabled = true;
    }
}

// معالجة إزالة الصوت
function handleRemoveSound() {
    stopCurrentSound();
    currentSoundFile = null;
    DOM.soundUpload.value = '';
    DOM.selectedSoundName.textContent = 'لا يوجد نغمة محددة';
    DOM.selectedSoundName.style.color = 'inherit';
    DOM.playSoundBtn.disabled = true;
    DOM.stopSoundBtn.disabled = true;
    DOM.removeSoundBtn.disabled = true;
    DOM.playSoundBtn.innerHTML = '<i class="fas fa-play"></i> استمع';
    DOM.playSoundBtn.classList.remove('sound-playing');
    
    // تحرير الذاكرة
    if (DOM.soundPreview._objectURL) {
        URL.revokeObjectURL(DOM.soundPreview._objectURL);
        DOM.soundPreview._objectURL = null;
    }
    DOM.soundPreview.src = '';
}

// تشغيل صوت مخصص
function playCustomSound(soundData) {
    if (!state.soundEnabled || !soundData) return;

    // إيقاف أي صوت شغال
    stopCurrentSound();

    try {
        // إذا كان الصوت مخزناً كـ Base64
        if (soundData.content) {
            const byteCharacters = atob(soundData.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: soundData.type || 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            
            audio.play().then(() => {
                state.currentPlayingSound = audio;
            }).catch(e => {
                console.error('خطأ في تشغيل الصوت المخصص:', e);
            });

            // تحرير الذاكرة بعد التشغيل
            audio.onended = () => {
                URL.revokeObjectURL(url);
                state.currentPlayingSound = null;
            };
        }
    } catch (error) {
        console.error('خطأ في تحميل الصوت:', error);
    }
}

// إضافة مهمة جديدة
function addTask(taskData) {
    const task = {
        id: Date.now(),
        name: taskData.name,
        startTime: new Date(taskData.startTime),
        endTime: new Date(taskData.endTime),
        completed: false,
        snoozed: false,
        createdAt: new Date(),
        hasCustomSound: !!currentSoundFile,
        originalEndTime: new Date(taskData.endTime) // حفظ وقت الانتهاء الأصلي
    };
    
    // التحقق من صحة الوقت
    if (task.startTime >= task.endTime) {
        alert('وقت الانتهاء يجب أن يكون بعد وقت البدء');
        return;
    }
    
    // حفظ الصوت إذا كان موجوداً
    if (currentSoundFile) {
        saveSoundForTask(task.id, currentSoundFile);
    }
    
    // إضافة المهمة
    state.tasks.push(task);
    saveTasks();
    renderTasks();
    updateStats();
    updateStorageInfo();
    
    // إعادة تعيين الحقول
    DOM.taskForm.reset();
    resetSoundFields();
    setDefaultTimes();
    
    // إشعار النجاح
    const soundMsg = currentSoundFile ? 'مع نغمة مخصصة' : '';
    showNotification('تم الإضافة', `تم إضافة "${task.name}" ${soundMsg}`);
    
    currentSoundFile = null;
}

// حفظ الصوت للمهمة
function saveSoundForTask(taskId, soundFile) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // استخراج محتوى Base64 من Data URL
            const base64Content = e.target.result.split(',')[1];
            
            const soundData = {
                content: base64Content,
                type: soundFile.type,
                name: soundFile.name,
                size: soundFile.size
            };
            
            // حفظ الصوت
            state.customSounds[taskId] = soundData;
            saveCustomSounds();
        } catch (error) {
            console.error('خطأ في حفظ الصوت:', error);
            alert('تعذر حفظ النغمة. حاول استخدام ملف أصغر.');
        }
    };
    
    reader.onerror = function() {
        console.error('خطأ في قراءة ملف الصوت');
        alert('تعذر قراءة ملف الصوت. حاول اختيار ملف آخر.');
    };
    
    reader.readAsDataURL(soundFile);
}

// إعادة تعيين حقول الصوت
function resetSoundFields() {
    stopCurrentSound();
    currentSoundFile = null;
    DOM.soundUpload.value = '';
    DOM.selectedSoundName.textContent = 'لا يوجد نغمة محددة';
    DOM.selectedSoundName.style.color = 'inherit';
    DOM.playSoundBtn.disabled = true;
    DOM.stopSoundBtn.disabled = true;
    DOM.removeSoundBtn.disabled = true;
    DOM.playSoundBtn.innerHTML = '<i class="fas fa-play"></i> استمع';
    DOM.playSoundBtn.classList.remove('sound-playing');
    
    // تحرير الذاكرة
    if (DOM.soundPreview._objectURL) {
        URL.revokeObjectURL(DOM.soundPreview._objectURL);
        DOM.soundPreview._objectURL = null;
    }
    DOM.soundPreview.src = '';
}

// عرض المهام
function renderTasks(filter = 'all') {
    if (state.tasks.length === 0) {
        DOM.tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>لا توجد مهام حالياً. أضف مهمة جديدة!</p>
            </div>
        `;
        return;
    }
    
    const now = new Date();
    let filteredTasks = [...state.tasks];
    
    if (filter === 'active') {
        filteredTasks = state.tasks.filter(task => 
            !task.completed && task.startTime <= now && task.endTime > now
        );
    } else if (filter === 'upcoming') {
        filteredTasks = state.tasks.filter(task => 
            !task.completed && task.startTime > now
        );
    } else if (filter === 'completed') {
        filteredTasks = state.tasks.filter(task => task.completed);
    } else if (filter === 'overdue') {
        filteredTasks = state.tasks.filter(task => 
            !task.completed && task.endTime < now
        );
    }
    
    // ترتيب المهام: النشطة أولاً، ثم المتأخرة، ثم القادمة، ثم المكتملة
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        const aIsOverdue = !a.completed && a.endTime < now;
        const bIsOverdue = !b.completed && b.endTime < now;
        if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
        
        const aIsActive = !a.completed && a.startTime <= now && a.endTime > now;
        const bIsActive = !b.completed && b.startTime <= now && b.endTime > now;
        if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
        
        return a.endTime - b.endTime;
    });
    
    DOM.tasksList.innerHTML = filteredTasks.map(task => {
        const now = new Date();
        const isActive = !task.completed && task.startTime <= now && task.endTime > now;
        const isUpcoming = !task.completed && task.startTime > now;
        const isOverdue = !task.completed && task.endTime < now;
        const isCompleted = task.completed;
        
        let statusClass = '';
        let statusText = '';
        
        if (isCompleted) {
            statusClass = 'completed';
            statusText = '<span class="status-badge status-completed">مكتملة</span>';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = '<span class="status-badge status-overdue">متأخرة</span>';
        } else if (isActive) {
            statusClass = 'active';
            statusText = '<span class="status-badge status-active">نشطة</span>';
        } else if (isUpcoming) {
            statusText = '<span class="status-badge status-upcoming">قادمة</span>';
        }
        
        const startTimeStr = formatDateTime(task.startTime);
        const endTimeStr = formatDateTime(task.endTime);
        
        // عرض وقت الانتهاء الفعلي
        let endTimeDisplay = endTimeStr;
        if (task.originalEndTime && task.endTime.getTime() !== task.originalEndTime.getTime()) {
            const originalEndStr = formatDateTime(task.originalEndTime);
            endTimeDisplay = `${endTimeStr} (تم التمديد من ${originalEndStr})`;
        }
        
        const timeLeft = task.endTime - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        let timeIndicator = '';
        
        if (!task.completed && timeLeft > 0) {
            if (hoursLeft < 1) {
                timeIndicator = '<span class="time-indicator time-urgent" title="أقل من ساعة"></span>';
            } else if (hoursLeft < 3) {
                timeIndicator = '<span class="time-indicator time-soon" title="أقل من 3 ساعات"></span>';
            }
        }
        
        // زر الصوت مع حالة التشغيل
        const soundBtnClass = state.currentPlayingSound && state.currentPlayingSound._taskId === task.id ? 
            'btn-sound playing' : 'btn-sound';
        const soundBtnIcon = state.currentPlayingSound && state.currentPlayingSound._taskId === task.id ? 
            'fa-pause' : 'fa-play-circle';
        
        return `
            <div class="task-item ${statusClass}" data-id="${task.id}">
                <div class="task-info">
                    <h4>${timeIndicator}${statusText}${task.name}</h4>
                    <div class="task-times">
                        <div><i class="fas fa-play"></i> <strong>البدء:</strong> ${startTimeStr}</div>
                        <div class="end-time-display ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-flag-checkered"></i> <strong>الانتهاء:</strong> ${endTimeDisplay}
                        </div>
                        ${isOverdue ? '<div style="color: #f72585;"><i class="fas fa-exclamation-triangle"></i> تجاوزت الوقت المحدد!</div>' : ''}
                        ${task.hasCustomSound ? '<div><i class="fas fa-music" style="color: #7209b7;"></i> نغمة مخصصة</div>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${task.hasCustomSound ? `
                        <button class="task-btn ${soundBtnClass}" onclick="playTaskSound(${task.id})" title="استمع للنغمة">
                            <i class="fas ${soundBtnIcon}"></i>
                        </button>
                    ` : ''}
                    ${!task.completed ? `
                        <button class="task-btn btn-complete" onclick="completeTask(${task.id})">
                            <i class="fas fa-check"></i> إكمال
                        </button>
                        <button class="task-btn btn-extend" onclick="openExtendPopup(${task.id})">
                            <i class="fas fa-clock"></i> تمديد
                        </button>
                    ` : ''}
                    <button class="task-btn btn-delete" onclick="deleteTask(${task.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// تنسيق التاريخ والوقت
function formatDateTime(date) {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    return date.toLocaleString('ar-SA', options);
}

// تحديث الإحصائيات
function updateStats() {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const active = state.tasks.filter(task => 
        !task.completed && task.startTime <= now && task.endTime > now
    ).length;
    
    const completed = state.tasks.filter(task => task.completed).length;
    
    const todayTasks = state.tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        return taskDate >= today && taskDate < tomorrow;
    }).length;
    
    DOM.activeTasks.textContent = active;
    DOM.completedTasks.textContent = completed;
    DOM.todayTasks.textContent = todayTasks;
}

// تشغيل صوت المهمة
function playTaskSound(taskId) {
    const soundData = state.customSounds[taskId];
    if (!soundData) {
        alert('لا توجد نغمة مخصصة لهذه المهمة');
        return;
    }
    
    // إذا كان نفس الصوت شغال، أوقفه
    if (state.currentPlayingSound && state.currentPlayingSound._taskId === taskId) {
        stopCurrentSound();
        renderTasks(); // تحديث الواجهة
        return;
    }
    
    // إيقاف أي صوت شغال
    stopCurrentSound();
    
    // تشغيل الصوت الجديد
    try {
        if (soundData.content) {
            const byteCharacters = atob(soundData.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: soundData.type || 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio._taskId = taskId; // تخزين معرف المهمة
            
            audio.play().then(() => {
                state.currentPlayingSound = audio;
                renderTasks(); // تحديث الواجهة
            }).catch(e => {
                console.error('خطأ في تشغيل الصوت:', e);
                alert('تعذر تشغيل النغمة.');
            });

            audio.onended = () => {
                URL.revokeObjectURL(url);
                state.currentPlayingSound = null;
                renderTasks(); // تحديث الواجهة
            };
            
            audio.onpause = () => {
                if (audio.currentTime > 0 && audio.currentTime < audio.duration) {
                    // إذا تم إيقافه يدوياً
                    state.currentPlayingSound = null;
                    renderTasks(); // تحديث الواجهة
                }
            };
        }
    } catch (error) {
        console.error('خطأ في تحميل الصوت:', error);
        alert('تعذر تحميل النغمة.');
    }
}

// فتح نافذة التمديد
function openExtendPopup(taskId) {
    extendTaskId = taskId;
    DOM.extendPopup.style.display = 'flex';
    
    // إعادة تعيين الخيارات
    document.getElementById('extend30').checked = true;
    DOM.customMinutes.disabled = true;
    DOM.customMinutes.value = '';
}

// تأكيد التمديد
function confirmExtend() {
    if (!extendTaskId) return;
    
    const task = state.tasks.find(t => t.id === extendTaskId);
    if (!task) {
        alert('المهمة غير موجودة');
        return;
    }
    
    let minutes = 30; // القيمة الافتراضية
    
    // الحصول على القيمة المختارة
    const selectedOption = document.querySelector('input[name="extendTime"]:checked');
    if (selectedOption.value === 'custom') {
        minutes = parseInt(DOM.customMinutes.value);
        if (isNaN(minutes) || minutes < 1 || minutes > 480) {
            alert('الرجاء إدخال عدد دقائق صحيح بين 1 و 480');
            return;
        }
    } else {
        minutes = parseInt(selectedOption.value);
    }
    
    // حفظ وقت الانتهاء الأصلي إذا لم يكن محفوظاً من قبل
    if (!task.originalEndTime) {
        task.originalEndTime = new Date(task.endTime);
    }
    
    // تمديد المهمة
    task.endTime = new Date(task.endTime.getTime() + minutes * 60000);
    
    // إيقاف الصوت إذا كان شغالاً
    stopCurrentSound();
    
    // حفظ وتحديث
    saveTasks();
    renderTasks();
    updateStats();
    
    DOM.extendPopup.style.display = 'none';
    extendTaskId = null;
    
    showNotification('تم التمديد', `تم تمديد "${task.name}" لمدة ${minutes} دقيقة`);
}

// إكمال المهمة
function completeTask(taskId) {
    const taskIndex = state.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        // إيقاف الصوت إذا كان شغالاً
        stopCurrentSound();
        
        state.tasks[taskIndex].completed = true;
        state.tasks[taskIndex].completedAt = new Date();
        saveTasks();
        renderTasks();
        updateStats();
        showNotification('مبروك!', `تم إكمال "${state.tasks[taskIndex].name}"`);
    }
}

// حذف المهمة
function deleteTask(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        // إيقاف الصوت إذا كان شغالاً
        stopCurrentSound();
        
        // حذف الصوت المرتبط إذا كان موجوداً
        if (state.customSounds[taskId]) {
            delete state.customSounds[taskId];
            saveCustomSounds();
        }
        
        state.tasks = state.tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
        showNotification('تم الحذف', 'تم حذف المهمة بنجاح');
    }
}

// التحقق من المهام
function checkTasks() {
    if (!state.autoNotifications) return;
    
    const now = new Date();
    state.tasks.forEach(task => {
        if (task.completed || task.snoozed) return;
        
        // التحقق من وقت البدء (قبل دقيقة واحدة)
        const startDiff = task.startTime - now;
        if (startDiff <= 60000 && startDiff > 0) {
            showNotification('⏰ بدء المهمة!', `حان وقت بدء: ${task.name}`, task.id);
        }
        
        // التحقق من وقت الانتهاء (قبل 5 دقائق)
        const endDiff = task.endTime - now;
        if (endDiff <= 300000 && endDiff > 0) {
            showNotification('🚨 اقترب وقت الانتهاء', `المهمة "${task.name}" ستنتهي خلال 5 دقائق`, task.id);
        }
        
        // التحقق من التأخير
        if (endDiff < 0 && !task.completed) {
            showNotification('⚠️ مهمة متأخرة!', `المهمة "${task.name}" تجاوزت وقتها المحدد`, task.id);
        }
    });
}

// بدء الفاحص
function startTaskChecker() {
    checkTasks();
    setInterval(checkTasks, 30000); // كل 30 ثانية
}

// التحقق من صلاحيات الإشعارات
function checkNotifications() {
    if ("Notification" in window && Notification.permission === "granted") {
        state.notificationPermission = true;
        updateNotificationUI();
    }
}

// تعيين الثيم
function setTheme(theme) {
    state.theme = theme;
    document.body.className = theme + '-theme';
    saveState();
}

// عرض إشعار
function showNotification(title, message, taskId = null) {
    if (!state.autoNotifications) return;
    
    // إشعار المتصفح
    if (state.notificationPermission && Notification.permission === "granted") {
        try {
            const notification = new Notification(title, {
                body: message,
                icon: 'icon.png',
                tag: `task-${taskId}`,
                requireInteraction: true,
                silent: !state.soundEnabled
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('خطأ في إشعار المتصفح:', error);
        }
    }
    
    // إشعار التطبيق
    DOM.popupTitle.textContent = title;
    DOM.popupMessage.textContent = message;
    DOM.notificationPopup.style.display = 'flex';
    
    // تشغيل الصوت المخصص إذا كان هناك مهمة مرتبطة
    if (state.soundEnabled && taskId) {
        const soundData = state.customSounds[taskId];
        
        if (soundData) {
            playCustomSound(soundData);
        } else {
            // استخدام الصوت الافتراضي
            playDefaultSound();
        }
    }
}

// تشغيل الصوت الافتراضي
function playDefaultSound() {
    if (DOM.soundPlayer) {
        DOM.soundPlayer.currentTime = 0;
        DOM.soundPlayer.play().catch(e => console.log('خطأ في تشغيل الصوت الافتراضي:', e));
    }
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // تفعيل الإشعارات
    DOM.notificationBtn.addEventListener('click', requestNotificationPermission);
    
    // إضافة مهمة
    DOM.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskData = {
            name: DOM.taskName.value.trim(),
            startTime: DOM.startTime.value,
            endTime: DOM.endTime.value
        };
        
        if (!taskData.name) {
            alert('الرجاء إدخال اسم المهمة');
            return;
        }
        
        addTask(taskData);
    });
    
    // حذف جميع المهام
    DOM.clearAllBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف جميع المهام؟ لا يمكن التراجع عن هذا الإجراء.')) {
            stopCurrentSound();
            state.tasks = [];
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('تم الحذف', 'تم حذف جميع المهام');
        }
    });
    
    // حذف جميع النغمات
    DOM.clearSoundsBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف جميع النغمات المخصصة؟')) {
            stopCurrentSound();
            state.customSounds = {};
            saveCustomSounds();
            
            // تحديث المهام
            state.tasks.forEach(task => {
                task.hasCustomSound = false;
            });
            saveTasks();
            
            renderTasks();
            resetSoundFields();
            showNotification('تم الحذف', 'تم حذف جميع النغمات المخصصة');
        }
    });
    
    // الإعدادات
    DOM.autoNotifications.addEventListener('change', (e) => {
        state.autoNotifications = e.target.checked;
        saveState();
    });
    
    DOM.soundEnabled.addEventListener('change', (e) => {
        state.soundEnabled = e.target.checked;
        saveState();
        
        // إذا تم تعطيل الأصوات، أوقف الصوت الحالي
        if (!state.soundEnabled) {
            stopCurrentSound();
        }
    });
    
    DOM.themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
    
    // تصفية المهام
    DOM.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderTasks(button.dataset.filter);
        });
    });
    
    // نافذة الإشعار
    DOM.popupClose.addEventListener('click', () => {
        DOM.notificationPopup.style.display = 'none';
        stopCurrentSound(); // إيقاف الصوت عند إغلاق النافذة
    });
    
    // نافذة التمديد
    DOM.extendConfirm.addEventListener('click', confirmExtend);
    DOM.extendCancel.addEventListener('click', () => {
        DOM.extendPopup.style.display = 'none';
        extendTaskId = null;
    });
    
    // تحديث عند تحميل الصفحة
    window.addEventListener('load', () => {
        checkNotifications();
        setDefaultTimes();
    });
    
    // إغلاق النوافذ بالنقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === DOM.notificationPopup) {
            DOM.notificationPopup.style.display = 'none';
            stopCurrentSound();
        }
        if (e.target === DOM.extendPopup) {
            DOM.extendPopup.style.display = 'none';
            extendTaskId = null;
        }
    });
    
    // إيقاف الصوت عند ترك الصفحة
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCurrentSound();
        }
    });
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', init);

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.playTaskSound = playTaskSound;
window.completeTask = completeTask;
window.openExtendPopup = openExtendPopup;
window.deleteTask = deleteTask;