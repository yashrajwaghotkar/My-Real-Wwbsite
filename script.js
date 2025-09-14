import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, limit, runTransaction, getDoc, setDoc, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getDatabase, ref, onValue, set, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

if (window.self === window.top) {
    document.body.innerHTML = '';
   
    document.body.style.backgroundColor = '#1c1c2e';
    document.body.style.color = '#fff';
    document.body.style.textAlign = 'center';
    document.body.style.paddingTop = '50px';
    document.body.style.fontFamily = 'Arial, sans-serif';
    
    document.body.innerHTML = `
        <h1 style="color: #ff6b6b;">Access Denied</h1>
        <p>You cannot access this page directly.</p>
        <p>Please visit <a style="color: #61dafb;" href="https://movixhub.netlify.app/">our main page</a> to continue.</p>
    `;
    
    throw new Error("Direct access is not permitted.");
}

const CONFIG_FILE_URL = 'https://raw.githubusercontent.com/yashrajwaghotkar/Live-TV-For-Android-TV/420c8d22b3cbf7f65c8e27280621e46635ae7d78/config.json'; 
const DEFAULT_SVG_ICON_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZDRoPSIxOCIgcng9IjIiIHJ5PSIyIj48L2NpcmNsZT48Y2lyY2xlIGN4PSI4LjUiIHkyPSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
const DEFAULT_FOLDER_ICON_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZDRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJjdXJyZW50Q29sb3IiPjxwYXRoIGQ9Ik0xMCA0SDRjLTEuMTEgMC0yIC44OS0yIDJ2MTJhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0yVjhjMC0xLjExLS45LTItMi0yaC04bC0yLTJ6Ij48L3BhdGg+PC9zdmc+';
const DEFAULT_PROFILE_PIC_URL = 'https://i.ibb.co/nsrvqTV9/profile.gif';
const OFFLINE_IMAGE_URL = 'https://i.ibb.co/Df22ZJyh/soon.gif';
const CACHE_EXPIRY_DURATION = 6 * 60 * 60 * 1000;
const APP_CACHE_KEY = 'entertainmentAppCache_v18_live_tv_folders'; // Cache version updated
const WATCH_HISTORY_KEY = 'entertainmentAppWatchHistory';
const USER_NAME_KEY = 'entertainmentAppUserName';
const USER_ID_KEY = 'entertainmentAppUserId';
const VOTE_STORAGE_KEY = 'entertainmentAppVotes';
const VIEW_STORAGE_KEY = 'entertainmentAppViews';
const AUTOPLAY_KEY = 'entertainmentAppAutoplay';

const COL = {
    TITLE: 0,                  
    STREAM_URL: 1,              
    LOGO_URL: 2,                
    IS_MOVIE: 3,                
    IS_SERIES: 4,               
    IS_ANIME: 5,                
    IS_ANIMATION: 6,            
    QUALITY_LOW_URL: 7,        
    QUALITY_MEDIUM_URL: 8,   
    QUALITY_HIGH_URL: 9,      
    RATING: 10,                 
    BADGE_TEXT: 11,            
    FOLDER_TITLE: 12,           
    SUB_FOLDER_TITLE: 13,       
    REQUIRES_VPN: 14,           
    IS_MAINTENANCE: 15,         
    IS_TRENDING: 16,            
    LOADER_ANIMATION_URL: 17,   
    WATERMARK_LOGO_URL: 18,     
    HEADER_IMG_URL: 19,         
    SPLASH_MEDIA_URL: 20,      
    WEBSITE_LINK: 21,           
    WEBSITE_NAME: 22,           
    DOWNLOAD_URL_480P: 23,      
    DOWNLOAD_URL_720P: 24,      
    DOWNLOAD_URL_1080P: 25,     
    LIVE_TV_NAME: 26,           
    LIVE_TV_LOGO_URL: 27,       
    LIVE_TV_STREAM_URL: 28,     
    LIVE_TV_WATERMARK_URL: 29,  
    LIVE_TV_LOADER_URL: 30,     
    LIVE_TV_MAINTENANCE: 31,    
    LIVE_TV_FOLDER_TITLE: 32    
};

let appConfig = {};
let triggerElement = null;
let allCategoriesInfoText = "";
let websiteLinks = [];
let currentPlayingCardId = null;
let watchHistory = {};
let userVotes = {};
let userViews = {};
let uniqueFolderTitles = [];
let currentSearchTerm = null;
let headerImageUrl = null;
let splashMediaItems = [];
let hasShownSplashPopup = false;
let allContentData = [];
let currentSection = 'all';
let currentlyPlayingStreamUrl = null;
let isCurrentPlayerLiveTV = false; 
let isFetchingConfig = false;
let isFetchingSheet = false;
let currentPopupItem = null;
let downloadCountdownIntervalId = null;
let unavailableCloseBtnIntervalId = null;
let activeSuggestionIndex = -1;
let currentScreenFitMode = 'contain';
let inactivityTimeout;
let customToastTimeoutId = null; 
let isBottomAdInjected = false;
let isAutoplayEnabled = false;
let nextPlayTimeoutId = null;
let nextPlayNotificationShown = false;
let isTransitioning = false;
const ANIMATION_DURATION = 300; 

let currentView = 'category'; 
let navigationPath = []; 

let backPressExitIntent = false;
let backPressTimeoutId = null;

let currentUser = { id: null, name: 'Guest', profilePictureUrl: DEFAULT_PROFILE_PIC_URL };
let userProfilesCache = {};

let firebaseApp;
let db;
let rtdb; // Realtime Database instance
let hlsInstance = null; 
let isNonAutoQualityPlaying = false;
let suggestionTimeout = null;
let currentPresenceRef = null; // For Live TV view count
let presenceListenerUnsubscribe = null; // To detach the listener

const loginOverlayEl = document.getElementById('loginOverlay');
const loginButtonEl = document.getElementById('loginButton');
const userNameInputEl = document.getElementById('userNameInput');
const loginErrorMsgEl = document.getElementById('loginErrorMsg');
const loginScreenLogoEl = document.getElementById('loginScreenLogo');
const appContainerEl = document.getElementById('appContainer');
const appHeaderEl = document.getElementById('appHeader');
const appTitleLogoEl = document.getElementById('appTitleLogo');
const appTitleTextImageEl = document.getElementById('appTitleTextImage');
const menuBtn = document.getElementById('menuBtn');
const drawerMenuEl = document.getElementById('drawerMenu');
const drawerNavListEl = document.getElementById('drawerNavList');
const drawerOverlayEl = document.getElementById('drawerOverlay');
const sectionTitleEl = document.getElementById('sectionTitle');
const sectionTitleIconEl = document.getElementById('sectionTitleIcon');
const backBtn = document.getElementById('backBtn');
const refreshSectionBtn = document.getElementById('refreshSectionBtn');
const allCategoriesViewElementsContainer = document.getElementById('allCategoriesViewElements');
const contentListContainer = document.getElementById('contentListContainer');
let navLinks = [];
const loader = document.getElementById('loader');
const errorMessageEl = document.getElementById('errorMessage');
const emptyStateAnimationEl = document.getElementById('emptyStateAnimation');
const mainContentWrapperEl = document.getElementById('mainContentWrapper');
const inlinePlayerWrapper = document.getElementById('inlinePlayerWrapper');
const inlinePlayerTitleText = document.getElementById('inlinePlayerTitleText');
const customPlayerCloseBtn = document.getElementById('customPlayerCloseBtn');
const scrollableContentAreaEl = document.getElementById('scrollableContentArea');
const sectionTitleWrapperEl = document.getElementById('sectionTitleWrapper');
const videoContainer = document.getElementById('videoContainer');
const nativeVideoPlayer = document.getElementById('inlineVideoPlayer');
const nativePlayerWatermarkEl = document.getElementById('nativePlayerWatermark');
const customVideoControls = document.getElementById('customVideoControls');
const playerLoader = document.getElementById('playerLoader');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressBar = document.getElementById('progressBar');
const timeDisplay = document.getElementById('timeDisplay');
const muteBtn = document.getElementById('muteBtn');
const volumeHighIcon = document.getElementById('volumeHighIcon');
const volumeMuteIcon = document.getElementById('volumeMuteIcon');
const volumeSlider = document.getElementById('volumeSlider');
const fitFillBtn = document.getElementById('fitFillBtn');
const fitIcon = document.getElementById('fitIcon');
const fillIcon = document.getElementById('fillIcon');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenOpenIcon = document.getElementById('fullscreenOpenIcon');
const fullscreenCloseIcon = document.getElementById('fullscreenCloseIcon');
const pipBtn = document.getElementById('pipBtn');
const playbackSpeedBtn = document.getElementById('playbackSpeedBtn');
const seekBackwardIndicator = document.getElementById('seekBackwardIndicator');
const seekForwardIndicator = document.getElementById('seekForwardIndicator');
const liveIndicatorEl = document.getElementById('liveIndicator');
const playbackSuggestionOverlayEl = document.getElementById('playbackSuggestionOverlay');
const playbackSuggestionTextEl = document.getElementById('playbackSuggestionText');
let lastTap = 0;
let singleTapTimeout = null;
const searchInputEl = document.getElementById('searchInput');
const suggestionsDropdownEl = document.getElementById('suggestionsDropdown');
const infoPopupOverlay = document.getElementById('infoPopupOverlay');
const infoPopupCloseBtn = document.getElementById('infoPopupCloseBtn');
const infoPopupBannerImg = document.getElementById('infoPopupBannerImg');
const infoPopupTitleEl = document.getElementById('infoPopupTitle');
const infoPopupLikesEl = document.getElementById('infoPopupLikes');
const infoPopupLikeCountEl = document.getElementById('infoPopupLikeCount');
const infoPopupViewsEl = document.getElementById('infoPopupViews');
const infoPopupViewCountEl = document.getElementById('infoPopupViewCount');
const infoPopupSectionEl = document.getElementById('infoPopupSection');
const infoPopupStatusMessageEl = document.getElementById('infoPopupStatusMessage');
const infoPopupRatingEl = document.getElementById('infoPopupRating');
const infoPopupRatingTextEl = document.getElementById('infoPopupRatingText');
const infoPopupRatingStarsEl = document.getElementById('infoPopupRatingStars');
const infoPopupDownloadBtn = document.getElementById('infoPopupDownloadBtn');
const infoPopupBadgeEl = document.getElementById('infoPopupBadge');
const infoPopupBadgeTextEl = document.getElementById('infoPopupBadgeText');
const infoPopupVoteContainer = document.getElementById('infoPopupVoteContainer');
const infoPopupLikeBtn = document.getElementById('infoPopupLikeBtn');
const infoPopupDislikeBtn = document.getElementById('infoPopupDislikeBtn');
const qualityPopupOverlay = document.getElementById('qualityPopupOverlay');
const qualityPopupCloseBtn = document.getElementById('qualityPopupCloseBtn');
const qualityOptionsContainer = document.getElementById('qualityOptionsContainer');
const qualityPopupTitleEl = document.getElementById('qualityPopupTitle'); 
const downloadQualityPopupOverlay = document.getElementById('downloadQualityPopupOverlay');
const downloadQualityPopupCloseBtn = document.getElementById('downloadQualityPopupCloseBtn');
const downloadQualityOptionsContainer = document.getElementById('downloadQualityOptionsContainer');
const bottomNavEl = document.getElementById('bottomNav');
let bottomNavLinks = [];
const welcomeToastEl = document.getElementById('welcomeToast');
const welcomeToastMessageEl = document.getElementById('welcomeToastMessage');
const welcomeToastCloseBtn = document.getElementById('welcomeToastCloseBtn');
const profilePopupOverlay = document.getElementById('profilePopupOverlay');
const profilePopupCloseBtn = document.getElementById('profilePopupCloseBtn');
const profileEditForm = document.getElementById('profileEditForm');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profilePicUrlInput = document.getElementById('profilePicUrlInput');
const profileErrorMsg = document.getElementById('profileErrorMsg');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const downloadGeneratingPopupOverlay = document.getElementById('downloadGeneratingPopupOverlay');
const downloadGeneratingTimerEl = document.getElementById('downloadGeneratingTimer');
const downloadUnavailablePopupOverlay = document.getElementById('downloadUnavailablePopupOverlay');
const downloadUnavailableCloseBtn = document.getElementById('downloadUnavailableCloseBtn');
const playerMessageOverlayEl = document.getElementById('playerMessageOverlay');
const playerMessageTextEl = document.getElementById('playerMessageText');
const playerMessageIconEl = document.querySelector('.player-message-icon');
const playerAdjacentContentEl = document.getElementById('playerAdjacentContent');
const nowPlayingInfoWrapperEl = document.getElementById('nowPlayingInfoWrapper');
const nowPlayingTitleEl = document.getElementById('nowPlayingTitle');
const nowPlayingBadgeEl = document.getElementById('nowPlayingBadge');
const nowPlayingBadgeTextEl = document.getElementById('nowPlayingBadgeText');
const nowPlayingLikesEl = document.getElementById('nowPlayingLikes');
const nowPlayingViewsEl = document.getElementById('nowPlayingViews');
const nowPlayingViewCountEl = document.getElementById('nowPlayingViewCount');
const nowPlayingRatingEl = document.getElementById('nowPlayingRating');
const nowPlayingRatingTextEl = document.getElementById('nowPlayingRatingText');
const nowPlayingRatingStarsEl = document.getElementById('nowPlayingRatingStars');
const nowPlayingSectionEl = document.getElementById('nowPlayingSection');
const nowPlayingFolderEl = document.getElementById('nowPlayingFolder');
const nowPlayingFolderTextEl = document.getElementById('nowPlayingFolderText');
const nowPlayingQualityEl = document.getElementById('nowPlayingQuality');
const nowPlayingQualityTextEl = document.getElementById('nowPlayingQualityText');
const nowPlayingVoteContainerEl = document.getElementById('nowPlayingVoteContainer');
const nowPlayingLikeBtnEl = document.getElementById('nowPlayingLikeBtn');
const nowPlayingDislikeBtnEl = document.getElementById('nowPlayingDislikeBtn');
const nowPlayingDownloadBtnEl = document.getElementById('nowPlayingDownloadBtn');
const nowPlayingWarningEl = document.getElementById('nowPlayingWarning');
const nowPlayingWarningTextEl = document.getElementById('nowPlayingWarningText');
const bottomBannerAdContainerEl = document.getElementById('bottomBannerAdContainer');
const upNextContainerEl = document.getElementById('upNextContainer');
const upNextItemsEl = document.getElementById('upNextItems');
const autoplayToggleEl = document.getElementById('autoplayToggle');
const nextPlayingOverlayEl = document.getElementById('nextPlayingOverlay');
const nextPlayingTitleEl = document.getElementById('nextPlayingTitle');
const cancelNextPlayBtn = document.getElementById('cancelNextPlayBtn');
const generatingAdContainer = document.getElementById('generatingAdContainer');
const unavailableAdContainer = document.getElementById('unavailableAdContainer');
const unavailableCloseBtnText = document.querySelector('#downloadUnavailableCloseBtn .close-icon-text');
const unavailableCloseBtnTimer = document.querySelector('#downloadUnavailableCloseBtn .close-icon-timer');

function showPlaybackSuggestion(message) {
    if (!playbackSuggestionOverlayEl || !playbackSuggestionTextEl) return;
    if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
    }
    playbackSuggestionTextEl.textContent = message;
    playbackSuggestionOverlayEl.classList.add('visible');
    suggestionTimeout = setTimeout(() => {
        playbackSuggestionOverlayEl.classList.remove('visible');
    }, 4000); 
}

function injectBannerAd(containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; 
    const adScript = document.createElement('script');
    adScript.type = 'text/javascript';
    adScript.innerHTML = `
        atOptions = {
            'key' : '8b5339b257d8fca6e4a1789a656216bf',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
        };
    `;
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/8b5339b257d8fca6e4a1789a656216bf/invoke.js';
    
    containerElement.appendChild(adScript);
    containerElement.appendChild(invokeScript);
}

function showBottomBannerAd() {
    if (!bottomBannerAdContainerEl) return;
    if (!isBottomAdInjected) {
        injectBannerAd(bottomBannerAdContainerEl);
        isBottomAdInjected = true;
    }
    bottomBannerAdContainerEl.style.display = 'flex';
}

function hideBottomBannerAd() {
    if (!bottomBannerAdContainerEl) return;
    bottomBannerAdContainerEl.style.display = 'none';
}

function showWelcomeToast() {
    if (!welcomeToastEl || !welcomeToastMessageEl) return;
    const welcomeMessage = `Welcome back, <strong>${escapeHTML(currentUser.name)}</strong>! Ready for some entertainment?`;
    showCustomToast(welcomeMessage, 'info', 5000);
}


function hideCustomToast() {
    if (!welcomeToastEl) return;
    welcomeToastEl.classList.remove('visible');
    if (customToastTimeoutId) clearTimeout(customToastTimeoutId);
}

function showCustomToast(message, type = 'info', duration = 5000) {
    if (!welcomeToastEl || !welcomeToastMessageEl) return;

    const iconEl = welcomeToastEl.querySelector('.welcome-toast-icon');
    const titleEl = welcomeToastEl.querySelector('.welcome-toast-title');
    
    if (customToastTimeoutId) clearTimeout(customToastTimeoutId);

    
    switch (type) {
        case 'success':
            iconEl.innerHTML = '&#9989;'; 
            titleEl.textContent = 'Success!';
            welcomeToastEl.style.borderLeftColor = '#4CAF50'; 
            break;
        case 'error':
            iconEl.innerHTML = '&#10060;'; 
            titleEl.textContent = 'Error!';
            welcomeToastEl.style.borderLeftColor = 'var(--highlight-color)';
            break;
        default: 
            iconEl.innerHTML = '&#127916;'; 
            titleEl.textContent = 'Greetings!';
            welcomeToastEl.style.borderLeftColor = 'var(--accent-color)';
            break;
    }

    welcomeToastMessageEl.innerHTML = message;
    welcomeToastEl.classList.add('visible');
    
    customToastTimeoutId = setTimeout(hideCustomToast, duration);
}

if (welcomeToastCloseBtn) {
    welcomeToastCloseBtn.addEventListener('click', hideCustomToast);
}

function renderUserProfileInDrawer() {
    const existingProfile = document.getElementById('drawerUserProfile');
    if (existingProfile) existingProfile.remove();
    const profileHTML = `
        <div class="drawer-user-profile" id="drawerUserProfile" role="button" tabindex="0" aria-label="Edit your profile">
            <img id="drawerProfilePic" src="${escapeHTML(currentUser.profilePictureUrl)}" alt="User Profile Picture" onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_PIC_URL}';">
            <div class="drawer-user-info">
                <strong id="drawerUserName">${escapeHTML(currentUser.name)}</strong>
                <span>View and edit profile</span>
            </div>
        </div>
    `;
    const drawerNavContainer = document.querySelector('.drawer-nav-container');
    if (drawerNavContainer) {
        drawerNavContainer.insertAdjacentHTML('afterbegin', profileHTML);
        document.getElementById('drawerUserProfile').addEventListener('click', openProfilePopup);
    }
     
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.style.setProperty('--current-user-avatar', `url('${escapeHTML(currentUser.profilePictureUrl)}')`);
    }
}

async function openProfilePopup() {
    triggerElement = document.activeElement;
    if (profileNameDisplay) profileNameDisplay.textContent = currentUser.name;
    profilePicUrlInput.value = currentUser.profilePictureUrl === DEFAULT_PROFILE_PIC_URL ? '' : currentUser.profilePictureUrl;
    profileErrorMsg.style.display = 'none';
    saveProfileBtn.disabled = false;
    profilePopupOverlay.classList.add('visible');
    profilePicUrlInput.focus();
}

function closeProfilePopup(calledInternally = false) {
    profilePopupOverlay.classList.remove('visible');
    if (!calledInternally && triggerElement) {
        triggerElement.focus();
        triggerElement = null;
    }
}

function getUsernameKey(rawUsername) {
    if (typeof rawUsername !== 'string') return '';
    const trimmedUsername = rawUsername.trim();
    const emojiRegex = new RegExp(`^(.*?)([\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]{0,2})$`, 'u');
    const match = trimmedUsername.match(emojiRegex);
    const namePart = match ? match[1].trim() : trimmedUsername;
    return namePart.toLowerCase();
}

async function handleProfileSave(e) {
    e.preventDefault();
    if (!db || !currentUser.id) return;
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Saving...';
    profileErrorMsg.style.display = 'none';
    let newPicUrl = profilePicUrlInput.value.trim() || DEFAULT_PROFILE_PIC_URL;
    const oldPicUrl = currentUser.profilePictureUrl;
    if (newPicUrl === oldPicUrl) {
        closeProfilePopup();
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Save Changes';
        return;
    }
    const userRef = doc(db, "users", currentUser.id);
    try {
        await setDoc(userRef, { profilePictureUrl: newPicUrl, userId: currentUser.id }, { merge: true });
        currentUser.profilePictureUrl = newPicUrl;
        if (userProfilesCache[currentUser.id]) {
            userProfilesCache[currentUser.id].profilePictureUrl = newPicUrl;
        }
        renderUserProfileInDrawer();
        closeProfilePopup();
        showCustomToast('Profile picture updated successfully!', 'success');
    } catch (error) {
        console.error("Error updating profile picture:", error);
        profileErrorMsg.textContent = "Failed to update profile picture. Please try again.";
        profileErrorMsg.style.display = 'block';
    } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Save Changes';
    }
}

function loadUserViews() {
    try {
        const storedViews = localStorage.getItem(VIEW_STORAGE_KEY);
        userViews = storedViews ? JSON.parse(storedViews) : {};
    } catch (e) {
        console.error("Could not parse user views from storage:", e);
        userViews = {};
    }
}

function saveUserViews() {
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(userViews));
}

async function incrementViewCount(itemId) {
    if (!db || !itemId || userViews[itemId] || !currentUser.id) return;
    userViews[itemId] = true;
    saveUserViews();
    try {
        const docRef = doc(db, "views", itemId);
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (docSnap.exists()) {
                 const currentCount = docSnap.data().viewCount || 0;
                 transaction.update(docRef, { viewCount: currentCount + 1 });
            } else {
                 transaction.set(docRef, { viewCount: 1 });
            }
        });
    } catch (e) {
        console.error("View count transaction failed: ", e);
        delete userViews[itemId];
        saveUserViews();
    }
}

async function loadViewCount(itemId) {
    if (!db) return;
    const docRef = doc(db, "views", itemId);
    try {
        onSnapshot(docRef, (docSnap) => {
            const count = docSnap.exists() ? docSnap.data().viewCount || 0 : 0;
            const formattedCount = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(count);
            document.querySelectorAll(`.item-views-badge[data-item-id="${itemId}"]`).forEach(badge => {
                badge.querySelector('.view-count').textContent = formattedCount;
            });
            if (nowPlayingInfoWrapperEl.style.display !== 'none' && currentPlayingCardId === itemId) {
                if(nowPlayingViewCountEl) nowPlayingViewCountEl.textContent = count.toLocaleString('en-US');
            }
            if (infoPopupViewCountEl && currentPopupItem?.id === itemId) {
                 infoPopupViewCountEl.textContent = count.toLocaleString('en-US');
            }
        });
    } catch (error) {
        console.error("Error getting view count: ", error);
    }
}

function loadUserVotes() {
    try {
        const storedVotes = localStorage.getItem(VOTE_STORAGE_KEY);
        userVotes = storedVotes ? JSON.parse(storedVotes) : {};
    } catch (e) {
        console.error("Could not parse user votes from storage:", e);
        userVotes = {};
    }
}

function saveUserVotes() {
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(userVotes));
}

function updateVoteUI(itemId) {
    const voteStatus = userVotes[itemId];
    const allLikeBtns = document.querySelectorAll(`.vote-btn.like-btn[data-item-id="${itemId}"]`);
    const allDislikeBtns = document.querySelectorAll(`.vote-btn.dislike-btn[data-item-id="${itemId}"]`);
    allLikeBtns.forEach(btn => {
        btn.classList.toggle('voted-like', voteStatus === 'like');
        const outlineIcon = btn.querySelector('.like-icon-outline');
        const filledIcon = btn.querySelector('.like-icon-filled');
        if (outlineIcon && filledIcon) {
            outlineIcon.style.display = voteStatus === 'like' ? 'none' : 'inline-block';
            filledIcon.style.display = voteStatus === 'like' ? 'inline-block' : 'none';
        }
    });
    allDislikeBtns.forEach(btn => btn.classList.toggle('voted-dislike', voteStatus === 'dislike'));
}

async function loadLikeDislikeCounts(itemId) {
    if (!db) return;
    const docRef = doc(db, "likes", itemId);
    try {
        onSnapshot(docRef, (docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : { likeCount: 0, dislikeCount: 0 };
            document.querySelectorAll(`[data-item-id="${itemId}"] .like-count`).forEach(span => span.textContent = data.likeCount || 0);
            document.querySelectorAll(`[data-item-id="${itemId}"] .dislike-count`).forEach(span => span.textContent = data.dislikeCount || 0);
        });
    } catch (error) { console.error("Error getting like/dislike counts: ", error); }
    updateVoteUI(itemId);
}

async function handleVote(itemId, newVoteType) {
    if (!db || !currentUser.id) return;
    const previousVote = userVotes[itemId];
    if (newVoteType === 'like' && previousVote !== 'like') {
        document.querySelectorAll(`.vote-btn.like-btn[data-item-id="${itemId}"]`).forEach(btn => {
            btn.classList.add('animate-like');
            setTimeout(() => btn.classList.remove('animate-like'), 300);
        });
    }
    if (previousVote === newVoteType) { delete userVotes[itemId]; } 
    else { userVotes[itemId] = newVoteType; }
    saveUserVotes();
    updateVoteUI(itemId);
    try {
        const docRef = doc(db, "likes", itemId);
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            let likeCount = 0;
            let dislikeCount = 0;
            if (docSnap.exists()) {
                likeCount = docSnap.data().likeCount || 0;
                dislikeCount = docSnap.data().dislikeCount || 0;
            }
            if (previousVote === newVoteType) { 
                if (newVoteType === 'like') likeCount--;
                else dislikeCount--;
            } else { 
                if (previousVote === 'like') likeCount--;
                if (previousVote === 'dislike') dislikeCount--;
                if (newVoteType === 'like') likeCount++;
                else dislikeCount++;
            }
            const payload = { 
                likeCount: Math.max(0, likeCount), 
                dislikeCount: Math.max(0, dislikeCount) 
            };
            if (docSnap.exists()) {
                transaction.update(docRef, payload);
            } else {
                transaction.set(docRef, payload);
            }
        });
    } catch (e) {
        console.error("Vote transaction failed: ", e);
        if (previousVote) { userVotes[itemId] = previousVote; } 
        else { delete userVotes[itemId]; }
        saveUserVotes();
        updateVoteUI(itemId);
        showCustomToast("Could not save your vote. Please try again.", 'error');
    }
}

function escapeHTML(str) {
    if(typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function loadAndDisplayComments(container, limitCount = null) {
    if (!db) return;
    let q;
    if (limitCount) {
        q = query(collection(db, "comments"), orderBy("timestamp", "desc"), limit(limitCount));
    } else {
        q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
    }
    const viewAllBtn = document.getElementById('viewAllCommentsBtn');

    onSnapshot(q, async (querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-color-muted);">No comments yet. Be the first to comment!</p>';
            if (viewAllBtn) viewAllBtn.style.display = 'none';
            return;
        }

        if (viewAllBtn) {
            const allCommentsQuery = query(collection(db, "comments"));
            const allDocsSnapshot = await getDocs(allCommentsQuery);
            viewAllBtn.style.display = allDocsSnapshot.size > 5 ? 'block' : 'none';
        }

        const comments = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        const userIdsToFetch = [...new Set(comments.map(c => c.userId).filter(id => id && !userProfilesCache[id]))];
        if (userIdsToFetch.length > 0) {
            const fetchPromises = userIdsToFetch.map(userId => getDoc(doc(db, "users", userId)));
            const userDocs = await Promise.all(fetchPromises);
            userDocs.forEach(docSnap => {
                if (docSnap.exists()) {
                    userProfilesCache[docSnap.id] = docSnap.data();
                }
            });
        }
        container.innerHTML = '';
        comments.forEach((comment) => {
            let authorName = 'Anonymous';
            let authorPic = DEFAULT_PROFILE_PIC_URL;
            const cachedProfile = userProfilesCache[comment.userId];
            if (cachedProfile) {
                authorName = cachedProfile.name;
                authorPic = cachedProfile.profilePictureUrl;
            } else if (comment.name) {
                authorName = comment.name;
            }
            const commentDate = comment.timestamp ? comment.timestamp.toDate().toLocaleString() : 'Just now';
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            commentItem.innerHTML = `
                <img class="comment-avatar" src="${escapeHTML(authorPic)}" alt="${escapeHTML(authorName)}'s profile picture" onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_PIC_URL}';">
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(authorName)}</span>
                        <span class="comment-date">${commentDate}</span>
                    </div>
                    <p class="comment-text">${escapeHTML(comment.commentText)}</p>
                </div>
            `;
            container.appendChild(commentItem);
        });
    });
}

function closeCommentsPopup(calledInternally = false) {
    const popupOverlay = document.getElementById('commentsPopupOverlay');
    if (!popupOverlay) return;
    popupOverlay.classList.remove('visible');
    popupOverlay.addEventListener('transitionend', () => {
        popupOverlay.remove();
        if (!calledInternally && triggerElement) {
            triggerElement.focus();
            triggerElement = null;
        }
    }, { once: true });
}

function openCommentsPopup() {
    triggerElement = document.activeElement;
    const popupHTML = `
        <div class="comments-popup-overlay popup-overlay" id="commentsPopupOverlay">
            <div class="comments-popup-content popup-content">
                <button class="popup-close-btn" id="commentsPopupCloseBtn" aria-label="Close Comments">×</button>
                <h3>All Public Comments</h3>
                <div id="fullCommentList">
                    <div class="loader"><div class="loader-spinner"></div></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    const popupOverlay = document.getElementById('commentsPopupOverlay');
    const closeBtn = document.getElementById('commentsPopupCloseBtn');
    loadAndDisplayComments(document.getElementById('fullCommentList'));
    setTimeout(() => { popupOverlay.classList.add('visible'); closeBtn.focus(); }, 10);
    closeBtn.addEventListener('click', () => closeCommentsPopup());
    popupOverlay.addEventListener('click', (e) => { if(e.target === popupOverlay) closeCommentsPopup(); });
}

function renderAndAttachCommentsSection(container) {
    if (document.getElementById('commentsSection')) {
        document.getElementById('commentsSection').style.display = 'block';
        return;
    };
    const commentsSectionHTML = `
        <div id="commentsSection">
            <h3><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>Public Comments</h3>
            <form id="commentForm">
                <div class="form-content">
                    <textarea id="commentText" placeholder="Join the discussion..." required rows="1"></textarea>
                    <button type="submit">
                        <span class="btn-text">Post</span>
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        <span class="btn-spinner"></span>
                    </button>
                </div>
            </form>
            <div id="commentList"></div>
            <button id="viewAllCommentsBtn" style="display: none;">View All Comments</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', commentsSectionHTML);
    
    const commentFormEl = document.getElementById('commentForm');
    if (commentFormEl) {
        commentFormEl.style.setProperty('--current-user-avatar', `url('${escapeHTML(currentUser.profilePictureUrl)}')`);
    }

    const commentForm = document.getElementById('commentForm');
    const commentTextInput = document.getElementById('commentText');
    const submitBtn = commentForm.querySelector('button');
    const viewAllBtn = document.getElementById('viewAllCommentsBtn');
    
    commentTextInput.addEventListener('input', () => {
        commentTextInput.style.height = 'auto';
        commentTextInput.style.height = (commentTextInput.scrollHeight) + 'px';
    });
    
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db) { showCustomToast("Comments feature not ready. Please wait.", "error"); return; }
        const name = currentUser.name;
        const userId = currentUser.id;
        const text = commentTextInput.value.trim();
        if (name && text && userId) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            try {
                await addDoc(collection(db, "comments"), { 
                    name, 
                    commentText: text, 
                    timestamp: serverTimestamp(),
                    userId: userId 
                });
                commentTextInput.value = '';
                commentTextInput.style.height = 'auto';
                showCustomToast("Your comment has been posted successfully.<br>Movies Hub!", 'success', 5000);
            } catch (error) { 
                console.error("Error adding comment: ", error);
                showCustomToast("Failed to post comment. Please try again.", "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        } else { showCustomToast("Please write a comment.", "error"); }
    });
    
    viewAllBtn.addEventListener('click', openCommentsPopup);
    loadAndDisplayComments(document.getElementById('commentList'), 5);
}

window.handleVote = handleVote;
window.loadLikeDislikeCounts = loadLikeDislikeCounts;
window.loadViewCount = loadViewCount;
window.renderAndAttachCommentsSection = renderAndAttachCommentsSection;
window.openCommentsPopup = openCommentsPopup;
window.closeCommentsPopup = closeCommentsPopup;

function shuffleArray(array) { let currentIndex = array.length, randomIndex; while (currentIndex != 0) { randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]; } return array; }
function triggerHapticFeedback(intensity = 50) { /* Vibration removed */ }
function loadDataFromCache() { const cachedData = localStorage.getItem(APP_CACHE_KEY); if (cachedData) { try { const parsed = JSON.parse(cachedData); if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_EXPIRY_DURATION)) { console.log("Loading data from cache."); appConfig = parsed.config || {}; allContentData = parsed.data || []; allCategoriesInfoText = parsed.infoText || ""; websiteLinks = parsed.websiteLinks || []; headerImageUrl = parsed.headerImageUrl || null; splashMediaItems = parsed.splashMediaItems || []; return true; } else { console.log("Cache expired or invalid."); localStorage.removeItem(APP_CACHE_KEY); } } catch (e) { console.error("Error parsing cache:", e); localStorage.removeItem(APP_CACHE_KEY); } } return false; }
function saveDataToCache() { const cacheObject = { timestamp: Date.now(), config: appConfig, data: allContentData, infoText: allCategoriesInfoText, websiteLinks: websiteLinks, headerImageUrl: headerImageUrl, splashMediaItems: splashMediaItems }; try { localStorage.setItem(APP_CACHE_KEY, JSON.stringify(cacheObject)); console.log("Data saved to cache."); } catch (e) { console.error("Error saving to cache:", e); } }
function loadWatchHistory() { const storedHistory = localStorage.getItem(WATCH_HISTORY_KEY); if (storedHistory) { watchHistory = JSON.parse(storedHistory); } }
function saveWatchHistory() { localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(watchHistory)); }

// UPDATED to store quality label
function updateWatchHistory(itemId, currentTime, duration, qualityLabel) {
    if (itemId && duration > 0 && currentTime > 10 && currentTime / duration < 0.95) {
        watchHistory[itemId] = { 
            currentTime: currentTime, 
            duration: duration, 
            lastWatched: Date.now(),
            quality: qualityLabel || 'Auto' // Store the quality label
        };
    } else if (itemId && watchHistory[itemId]) {
        delete watchHistory[itemId];
    }
    saveWatchHistory();
}

async function fetchAppConfiguration() { if (isFetchingConfig) return false; isFetchingConfig = true; try { const response = await fetch(CONFIG_FILE_URL); if (!response.ok) { throw new Error(`HTTP error! status: ${response.status} for config file.`); } const fetchedConfig = await response.json(); appConfig = {...appConfig, ...fetchedConfig}; console.log("App configuration loaded/updated:", appConfig); if (appConfig.firebaseConfig && (!db || !rtdb)) { firebaseApp = initializeApp(appConfig.firebaseConfig); db = getFirestore(firebaseApp); rtdb = getDatabase(firebaseApp); } else if (!appConfig.firebaseConfig) { console.error("Firebase config not found in the fetched JSON."); } saveDataToCache(); return true; } catch (error) { console.error("Failed to load app configuration:", error); if (!appConfig.googleSheetApiKey) { showCriticalError(`Could not load configuration file. Error: ${error.message}`); } return false; } finally { isFetchingConfig = false; } }
function showCriticalError(message) { if (loginOverlayEl && !loginOverlayEl.classList.contains('hidden')) { const loginBox = loginOverlayEl.querySelector('.login-box'); if (loginBox) { loginBox.innerHTML = `<h1 style="color: var(--highlight-color);">Critical Error 🌐</h1><p>${message}</p>`; } } else { showError(message); } if (loginButtonEl) loginButtonEl.disabled = true; }
function validateUsername(rawUsername) {
    const trimmedUsername = rawUsername.trim();
    if (trimmedUsername === "") {
        return { isValid: false, message: 'Name cannot be empty.' };
    }
    const emojiRegex = new RegExp(`^(.*?)([\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]{0,2})$`, 'u');
    const match = trimmedUsername.match(emojiRegex);
    const namePart = match ? match[1].trim() : trimmedUsername;
    if (namePart.length < 3 || namePart.length > 20) {
        return { isValid: false, message: 'Name part must be 3-20 characters long.' };
    }
    if (!/[A-Z]/.test(namePart)) {
        return { isValid: false, message: 'Name must contain at least one capital letter.' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(namePart)) {
        return { isValid: false, message: 'Name can only contain letters and numbers.' };
    }
    return { isValid: true, message: null };
}
async function handleLogin() {
    if (!db) {
        loginErrorMsgEl.textContent = 'Database connection not ready. Please wait.';
        loginErrorMsgEl.style.display = 'block';
        return;
    }
    loginButtonEl.disabled = true;
    loginButtonEl.textContent = 'Checking...';
    const rawUsername = userNameInputEl.value;
    const validation = validateUsername(rawUsername);
    if (!validation.isValid) {
        loginErrorMsgEl.textContent = validation.message;
        loginErrorMsgEl.style.display = 'block';
        loginButtonEl.disabled = false;
        loginButtonEl.textContent = "Let's Go🎥";
        return;
    }
    const finalUsername = rawUsername.trim();
    const usernameKey = getUsernameKey(finalUsername);
    const usernameRef = doc(db, "usernames", usernameKey);
    try {
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
            loginErrorMsgEl.textContent = 'This name is already taken. Please choose another.';
            loginErrorMsgEl.style.display = 'block';
            loginButtonEl.disabled = false;
            loginButtonEl.textContent = "Let's Go🎥";
            return;
        }
        loginButtonEl.textContent = 'Setting up...';
        const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const userRef = doc(db, "users", userId);
        await runTransaction(db, async (transaction) => {
            const usernameDocInTransaction = await transaction.get(usernameRef);
            if (usernameDocInTransaction.exists()) {
                throw new Error("Username was just taken. Please try a different name.");
            }
            transaction.set(userRef, {
                userId: userId,
                name: finalUsername,
                profilePictureUrl: DEFAULT_PROFILE_PIC_URL,
                createdAt: serverTimestamp() 
            });
            transaction.set(usernameRef, { userId: userId });
        });
        localStorage.setItem(USER_NAME_KEY, finalUsername);
        localStorage.setItem(USER_ID_KEY, userId);
        currentUser = { id: userId, name: finalUsername, profilePictureUrl: DEFAULT_PROFILE_PIC_URL };
        userProfilesCache[userId] = { ...currentUser };
        proceedToApp();
    } catch (error) {
        console.error("Login transaction failed: ", error);
        loginErrorMsgEl.textContent = error.message || 'An error occurred. Please try again.';
        loginErrorMsgEl.style.display = 'block';
        loginButtonEl.disabled = false;
        loginButtonEl.textContent = "Let's Go🎥";
    }
}
async function proceedToApp() {
    document.body.classList.add('user-logged-in');
    loginOverlayEl.classList.add('hidden'); 
    appContainerEl.classList.add('visible'); 
    if(menuBtn) menuBtn.focus(); 
    loginOverlayEl.addEventListener('transitionend', () => { loginOverlayEl.style.display = 'none'; }, { once: true }); 
    showWelcomeToast();
    initializeAppUI(); 
    if (allContentData.length === 0 && !isFetchingSheet) { await fetchDataFromSheet(); } 
    else { renderContent(); }
}
if (loginButtonEl) { loginButtonEl.addEventListener('click', handleLogin); }
if (userNameInputEl) { 
    userNameInputEl.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && !loginButtonEl.disabled) {
            handleLogin();
        }
    });
    userNameInputEl.addEventListener('input', () => {
        const validation = validateUsername(userNameInputEl.value);
        if (validation.isValid) {
            loginErrorMsgEl.style.display = 'none';
            loginButtonEl.disabled = false;
        } else {
            loginErrorMsgEl.textContent = validation.message;
            loginErrorMsgEl.style.display = 'block';
            loginButtonEl.disabled = true;
            loginErrorMsgEl.dataset.lastError = validation.message;
        }
    });
}
if (profilePopupCloseBtn) profilePopupCloseBtn.addEventListener('click', () => closeProfilePopup());
if (profilePopupOverlay) profilePopupOverlay.addEventListener('click', e => { if (e.target === profilePopupOverlay) closeProfilePopup(); });
if (profileEditForm) profileEditForm.addEventListener('submit', handleProfileSave);
menuBtn.addEventListener('click', toggleDrawer);
drawerOverlayEl.addEventListener('click', toggleDrawer);
customPlayerCloseBtn.addEventListener('click', () => closeInlineVideoPlayer(false));
document.addEventListener('keydown', (e) => { if (inlinePlayerWrapper.classList.contains('active')) { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlayPause(); } else if (e.key === 'f') { e.preventDefault(); toggleFullscreen(); } else if (e.key === 'm') { e.preventDefault(); toggleMute(); } else if (e.key === 'p') { e.preventDefault(); togglePip(); } else if (e.key === 'ArrowRight' && !isCurrentPlayerLiveTV) { nativeVideoPlayer.currentTime += 5; } else if (e.key === 'ArrowLeft' && !isCurrentPlayerLiveTV) { nativeVideoPlayer.currentTime -= 5; } } if (e.key === "Escape") { e.preventDefault(); handleBackPress(); } });
function togglePlayPause() { if (nativeVideoPlayer.paused || nativeVideoPlayer.ended) { nativeVideoPlayer.play(); } else { nativeVideoPlayer.pause(); } }
function handleDoubleTap(e) { 
    if (e.target.closest('#customVideoControls') || e.target.closest('#playerMessageOverlay') || e.target.closest('#nextPlayingOverlay')) { 
        return; 
    } 
    e.preventDefault(); 
    const now = new Date().getTime(); 
    const timeSince = now - lastTap; 
    clearTimeout(singleTapTimeout); 
    if (timeSince < 300 && timeSince > 0) { 
        lastTap = 0;
        
        if (isCurrentPlayerLiveTV) {
            return;
        }

        if (playerLoader.classList.contains('visible')) {
            return;
        }
        
        const rect = videoContainer.getBoundingClientRect(); 
        const tapX = e.changedTouches[0].clientX - rect.left; 
        let indicator; 
        if (tapX > rect.width / 2) { 
            nativeVideoPlayer.currentTime = Math.min(nativeVideoPlayer.duration, nativeVideoPlayer.currentTime + 10); 
            indicator = seekForwardIndicator; 
        } else { 
            nativeVideoPlayer.currentTime = Math.max(0, nativeVideoPlayer.currentTime - 10); 
            indicator = seekBackwardIndicator; 
        } 
        indicator.classList.add('show'); 
        setTimeout(() => indicator.classList.remove('show'), 500); 
    } else { 
        singleTapTimeout = setTimeout(() => { 
            if (videoContainer.classList.contains('controls-hidden')) { 
                handleControlsVisibility(); 
            } else if (!nativeVideoPlayer.paused) { 
                videoContainer.classList.add('controls-hidden'); 
            } 
        }, 300); 
    } 
    lastTap = now; 
}
function updatePlayPauseIcon() { if (nativeVideoPlayer.paused || nativeVideoPlayer.ended) { playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; playPauseBtn.setAttribute('aria-label', 'Play'); } else { playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; playPauseBtn.setAttribute('aria-label', 'Pause'); } }
function updateProgress() { 
    if (isCurrentPlayerLiveTV || isNaN(nativeVideoPlayer.duration)) return;
    progressBar.value = nativeVideoPlayer.currentTime; 
    const progressPercent = (nativeVideoPlayer.currentTime / nativeVideoPlayer.duration) * 100; 
    progressBar.style.background = `linear-gradient(to right, var(--accent-color) ${progressPercent}%, rgba(255, 255, 255, 0.3) ${progressPercent}%)`; 
    const currentTime = formatTime(nativeVideoPlayer.currentTime); 
    const duration = formatTime(nativeVideoPlayer.duration); 
    timeDisplay.textContent = `${currentTime} / ${duration}`; 
    
    // Pass the current quality label to watch history
    const qualityLabel = nowPlayingQualityTextEl.textContent || 'Auto';
    updateWatchHistory(currentPlayingCardId, nativeVideoPlayer.currentTime, nativeVideoPlayer.duration, qualityLabel); 

    if (nativeVideoPlayer.currentTime >= 5 && !userViews[currentPlayingCardId]) {
        incrementViewCount(currentPlayingCardId);
    }
    if (isAutoplayEnabled && !nextPlayNotificationShown && (nativeVideoPlayer.duration - nativeVideoPlayer.currentTime <= 5)) {
        showNextPlayNotification();
    }
}
function setProgress() { nativeVideoPlayer.currentTime = progressBar.value; }
function formatTime(timeInSeconds) { if (isNaN(timeInSeconds)) return "00:00"; const date = new Date(timeInSeconds * 1000); const hours = date.getUTCHours(); const minutes = date.getUTCMinutes(); const seconds = date.getUTCSeconds().toString().padStart(2, '0'); if (hours) { return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`; } return `${minutes}:${seconds}`; }
function toggleMute() { nativeVideoPlayer.muted = !nativeVideoPlayer.muted; }
function updateVolumeIcon() { if (nativeVideoPlayer.muted || nativeVideoPlayer.volume === 0) { volumeMuteIcon.style.display = 'block'; volumeHighIcon.style.display = 'none'; muteBtn.setAttribute('aria-label', 'Unmute'); } else { volumeMuteIcon.style.display = 'none'; volumeHighIcon.style.display = 'block'; muteBtn.setAttribute('aria-label', 'Mute'); } }
function handleVolumeChange() { nativeVideoPlayer.volume = volumeSlider.value; nativeVideoPlayer.muted = volumeSlider.value == 0; }
function toggleFitFill() { if (currentScreenFitMode === 'contain') { currentScreenFitMode = 'cover'; nativeVideoPlayer.classList.remove('video-mode-contain'); nativeVideoPlayer.classList.add('video-mode-cover'); fillIcon.style.display = 'none'; fitIcon.style.display = 'block'; fitFillBtn.setAttribute('aria-label', 'Switch to Fit Mode'); } else { currentScreenFitMode = 'contain'; nativeVideoPlayer.classList.remove('video-mode-cover'); nativeVideoPlayer.classList.add('video-mode-contain'); fillIcon.style.display = 'block'; fitIcon.style.display = 'none'; fitFillBtn.setAttribute('aria-label', 'Switch to Fit Mode'); } }
async function toggleFullscreen() { 
    if (!document.fullscreenElement) { 
        await videoContainer.requestFullscreen(); 
        showPlaybackSuggestion("Use controls to exit fullscreen"); // Custom message on entering fullscreen
        try { 
            if (screen.orientation && typeof screen.orientation.lock === 'function') { 
                await screen.orientation.lock('landscape'); 
            } 
        } catch (err) { 
            console.warn('Could not lock screen to landscape:', err); 
        } 
    } else { 
        if (screen.orientation && typeof screen.orientation.unlock === 'function') { 
            screen.orientation.unlock(); 
        } 
        await document.exitFullscreen(); 
    } 
}
function updateFullscreenIcon() { if (!document.fullscreenElement) { fullscreenOpenIcon.style.display = 'block'; fullscreenCloseIcon.style.display = 'none'; fullscreenBtn.setAttribute('aria-label', 'Enter Fullscreen'); } else { fullscreenOpenIcon.style.display = 'none'; fullscreenCloseIcon.style.display = 'block'; fullscreenBtn.setAttribute('aria-label', 'Exit Fullscreen'); } }
async function togglePip() { if (!document.pictureInPictureEnabled) return; try { if (document.pictureInPictureElement) { await document.exitPictureInPicture(); } else { await nativeVideoPlayer.requestPictureInPicture(); } } catch (error) { console.error("PiP Error:", error); } }
function togglePlaybackSpeed() { if (nativeVideoPlayer.playbackRate === 1) { nativeVideoPlayer.playbackRate = 2; playbackSpeedBtn.textContent = '2x'; } else { nativeVideoPlayer.playbackRate = 1; playbackSpeedBtn.textContent = '1x'; } }
function handleControlsVisibility() { clearTimeout(inactivityTimeout); videoContainer.classList.remove('controls-hidden'); inactivityTimeout = setTimeout(() => { if (!nativeVideoPlayer.paused && playerMessageOverlayEl.style.display === 'none') { videoContainer.classList.add('controls-hidden'); } }, 3000); }
if (nativeVideoPlayer) { nativeVideoPlayer.addEventListener('play', updatePlayPauseIcon); nativeVideoPlayer.addEventListener('pause', updatePlayPauseIcon); nativeVideoPlayer.addEventListener('timeupdate', updateProgress); nativeVideoPlayer.addEventListener('loadedmetadata', () => { progressBar.max = nativeVideoPlayer.duration; updateProgress(); }); nativeVideoPlayer.addEventListener('volumechange', () => { volumeSlider.value = nativeVideoPlayer.volume; updateVolumeIcon(); }); nativeVideoPlayer.addEventListener('waiting', () => playerLoader.classList.add('visible')); nativeVideoPlayer.addEventListener('playing', () => { playerLoader.classList.remove('visible'); nextPlayNotificationShown = false; }); nativeVideoPlayer.addEventListener('canplay', () => playerLoader.classList.remove('visible')); nativeVideoPlayer.addEventListener('ended', () => { updatePlayPauseIcon(); clearTimeout(nextPlayTimeoutId); if(currentPlayingCardId && watchHistory[currentPlayingCardId]){ delete watchHistory[currentPlayingCardId]; saveWatchHistory(); if(currentSection === 'all') { renderContent(); } } if (isAutoplayEnabled) { playNextVideo(); } }); nativeVideoPlayer.addEventListener('error', () => { playerLoader.classList.remove('visible'); const customImg = playerLoader.querySelector('.custom-loader-img'); if (customImg) customImg.src = ''; document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); updatePlayingIndicator(null); const error = nativeVideoPlayer.error; console.error("HTML5 Player Error:", error); const errorMessage = error ? (error.message || `Code: ${error.code}`) : 'Unknown playback error'; showError(`Video Error: ${errorMessage}. Please check stream or try again.`); }); videoContainer.addEventListener('mousemove', handleControlsVisibility); videoContainer.addEventListener('mouseleave', () => { clearTimeout(inactivityTimeout); if (!nativeVideoPlayer.paused && playerMessageOverlayEl.style.display === 'none') { videoContainer.classList.add('controls-hidden'); } }); videoContainer.addEventListener('touchend', handleDoubleTap); playPauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); }); progressBar.addEventListener('input', () => { if (isNonAutoQualityPlaying) { showPlaybackSuggestion("Use double-tap Gesture for a smooth playback experience"); } setProgress(); }); muteBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); }); volumeSlider.addEventListener('input', (e) => { e.stopPropagation(); handleVolumeChange(); }); fitFillBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFitFill(); }); fullscreenBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); }); pipBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePip(); }); playbackSpeedBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlaybackSpeed(); }); document.addEventListener('fullscreenchange', updateFullscreenIcon); }
if (infoPopupCloseBtn) infoPopupCloseBtn.addEventListener('click', () => closeInfoPopup());
if (infoPopupOverlay) infoPopupOverlay.addEventListener('click', (e) => { if (e.target === infoPopupOverlay) closeInfoPopup();});
if (qualityPopupCloseBtn) qualityPopupCloseBtn.addEventListener('click', () => closeQualityPopup());
if (qualityPopupOverlay) qualityPopupOverlay.addEventListener('click', (e) => { if (e.target === qualityPopupOverlay) closeQualityPopup(); });
if (downloadQualityPopupCloseBtn) downloadQualityPopupCloseBtn.addEventListener('click', () => closeDownloadQualityPopup());
if (downloadQualityPopupOverlay) downloadQualityPopupOverlay.addEventListener('click', (e) => { if (e.target === downloadQualityPopupOverlay) closeDownloadQualityPopup(); });
if (downloadUnavailableCloseBtn) downloadUnavailableCloseBtn.addEventListener('click', () => { if(!downloadUnavailableCloseBtn.disabled) closeUnavailableLinkPopup(); });
if (downloadUnavailablePopupOverlay) downloadUnavailablePopupOverlay.addEventListener('click', (e) => { if (e.target === downloadUnavailablePopupOverlay && !downloadUnavailableCloseBtn.disabled) closeUnavailableLinkPopup(); });
if (searchInputEl) { searchInputEl.addEventListener('input', (e) => { showSuggestions(e.target.value); }); searchInputEl.addEventListener('focus', (e) => { if (e.target.value.length >= 1 && suggestionsDropdownEl.children.length > 0) { showSuggestions(e.target.value); } else if (e.target.value.length >=1) { showSuggestions(e.target.value); } }); searchInputEl.addEventListener('keydown', (e) => { const suggestions = suggestionsDropdownEl.querySelectorAll('.suggestion-item'); if (suggestionsDropdownEl.style.display === 'block' && suggestions.length > 0) { if (e.key === 'ArrowDown') { e.preventDefault(); activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length; updateActiveSuggestion(suggestions); } else if (e.key === 'ArrowUp') { e.preventDefault(); activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length; updateActiveSuggestion(suggestions); } else if (e.key === 'Enter' && activeSuggestionIndex > -1) { e.preventDefault(); suggestions[activeSuggestionIndex].click(); } } }); document.addEventListener('click', (e) => { if (searchInputEl && suggestionsDropdownEl && !searchInputEl.contains(e.target) && !suggestionsDropdownEl.contains(e.target)) { suggestionsDropdownEl.style.display = 'none'; activeSuggestionIndex = -1; } }); }
function updateActiveSuggestion(suggestions) { suggestions.forEach((item, index) => { item.classList.toggle('active-suggestion', index === activeSuggestionIndex); if (index === activeSuggestionIndex) item.focus(); }); }
function toggleDrawer(){ const isOpenCurrently = drawerMenuEl.classList.contains("open"); if (!isOpenCurrently) { triggerElement = document.activeElement; } const isOpen = drawerMenuEl.classList.toggle("open"); drawerOverlayEl.classList.toggle("visible"); menuBtn.setAttribute("aria-expanded", String(isOpen)); drawerMenuEl.setAttribute("aria-hidden", String(!isOpen)); menuBtn.innerHTML = isOpen ? "&times;" : "☰"; menuBtn.classList.toggle("close-icon", isOpen); menuBtn.setAttribute("aria-label", isOpen ? "Close Menu" : "Open Menu"); if (isOpen) { const firstFocusable = drawerMenuEl.querySelector('#drawerUserProfile') || drawerNavListEl.querySelector('a.nav-link'); if (firstFocusable) firstFocusable.focus(); } else { if (triggerElement) { triggerElement.focus(); } else { menuBtn.focus(); } triggerElement = null; } }
function setActiveNavLink(activeLinkEl){ navLinks.forEach(link=>link.classList.remove("active")); if (activeLinkEl) activeLinkEl.classList.add("active"); bottomNavLinks.forEach(link => link.classList.remove("active")); const bottomLink = document.querySelector(`.bottom-nav-item[data-section="${activeLinkEl ? activeLinkEl.dataset.section : ''}"]`); if (bottomLink) bottomLink.classList.add('active'); }
function showLoader(show){ loader.style.display = show ? "flex" : "none"; if(show) { if (contentListContainer) { contentListContainer.innerHTML = ""; contentListContainer.classList.remove('content-visible'); } if (allCategoriesViewElementsContainer) { allCategoriesViewElementsContainer.innerHTML = ""; allCategoriesViewElementsContainer.classList.remove('content-visible'); } showEmptyState(false); hideError(); } }
function showError(message){ document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); if(errorMessageEl) { const textNode = document.createTextNode(message); errorMessageEl.innerHTML = ''; errorMessageEl.appendChild(textNode); const refreshBtn = document.createElement('button'); refreshBtn.textContent = 'Refresh and Go Home'; refreshBtn.className = 'login-btn'; refreshBtn.style.cssText = "margin-top: 20px; width: auto; padding: 10px 20px; font-size: 15px;"; refreshBtn.onclick = () => { closeAllPopups(); closeInlineVideoPlayer(true); currentSection = 'all'; const allLink = drawerNavListEl.querySelector('.nav-link[data-section="all"]'); if (allLink) { setActiveNavLink(allLink); } resetNavigation(); renderContent(); }; errorMessageEl.appendChild(document.createElement('br')); errorMessageEl.appendChild(refreshBtn); errorMessageEl.style.display = "block"; } if(contentListContainer) contentListContainer.innerHTML = ""; if (allCategoriesViewElementsContainer) allCategoriesViewElementsContainer.innerHTML = ""; showEmptyState(false); showLoader(false); console.error("Application Error:", message); }
function hideError(){ if(errorMessageEl) errorMessageEl.style.display = "none"; }
function showEmptyState(show, message = "No content available here.") { if (!emptyStateAnimationEl) return; const lottiePlayer = emptyStateAnimationEl.querySelector('lottie-player'); let messageP = emptyStateAnimationEl.querySelector('p.empty-message'); if (show) { if (!messageP) { messageP = document.createElement('p'); messageP.className = 'empty-message'; emptyStateAnimationEl.appendChild(messageP); } messageP.textContent = message; emptyStateAnimationEl.style.display = 'flex'; if (lottiePlayer && typeof lottiePlayer.play === 'function') { lottiePlayer.stop(); lottiePlayer.play(); } if (contentListContainer) contentListContainer.innerHTML = ""; if (allCategoriesViewElementsContainer) allCategoriesViewElementsContainer.innerHTML = ""; hideError(); } else { emptyStateAnimationEl.style.display = 'none'; if (lottiePlayer && typeof lottiePlayer.stop === 'function') { lottiePlayer.stop(); } } }
function closeAllPopups() { closeProfilePopup(true); closeCommentsPopup(true); closeInfoPopup(true); closeQualityPopup(true); closeDownloadQualityPopup(true); closeGeneratingLinkPopup(true); closeUnavailableLinkPopup(true); } // Pass true to indicate internal call

function showSuggestions(query) {
    activeSuggestionIndex = -1;
    if (!query || query.length < 1) {
        suggestionsDropdownEl.innerHTML = '';
        suggestionsDropdownEl.style.display = 'none';
        return;
    }
    const lowerQuery = query.toLowerCase();

    const mainFoldersFromSubContent = new Map();
    allContentData
        .filter(item =>
            item.folderTitle && item.subFolderTitle && 
            item.title.toLowerCase().includes(lowerQuery)
        )
        .forEach(item => {
            if (!mainFoldersFromSubContent.has(item.folderTitle)) {
                mainFoldersFromSubContent.set(item.folderTitle, {
                    title: item.folderTitle,
                    type: 'folder' 
                });
            }
        });

    const matchedItemsInMainFolders = allContentData
        .filter(item =>
            item.folderTitle && !item.subFolderTitle &&
            item.title.toLowerCase().includes(lowerQuery)
        )
        .map(item => ({ ...item, type: 'content' }));

    // UPDATED to include horizontal list folders in search
    const matchedHorizontalFolders = allContentData
        .filter(item => item.folderTitle && !item.subFolderTitle)
        .map(item => item.folderTitle);
        
    const uniqueHorizontalFolders = [...new Set(matchedHorizontalFolders)]
        .filter(folderTitle => folderTitle.toLowerCase().includes(lowerQuery))
        .map(folderTitle => ({ title: folderTitle, type: 'horizontal_folder' }));

    const matchedGridFolders = uniqueFolderTitles
        .filter(folderTitle => folderTitle.toLowerCase().includes(lowerQuery))
        .map(folderTitle => ({
            title: folderTitle,
            type: 'grid_folder'
        }));
        
    const combinedFolders = new Map();
    [...uniqueHorizontalFolders, ...matchedGridFolders, ...mainFoldersFromSubContent.values()].forEach(folder => {
        if (!combinedFolders.has(folder.title)) {
            combinedFolders.set(folder.title, folder);
        }
    });

    const combinedResults = [...combinedFolders.values(), ...matchedItemsInMainFolders].slice(0, 10);

    suggestionsDropdownEl.innerHTML = '';
    if (combinedResults.length > 0) {
        combinedResults.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'suggestion-item';
            itemEl.tabIndex = -1;

            const title = item.title;
            const startIndex = title.toLowerCase().indexOf(lowerQuery);
            const endIndex = startIndex + lowerQuery.length;
            const highlightedTitle = `${title.substring(0, startIndex)}<strong>${title.substring(startIndex, endIndex)}</strong>${title.substring(endIndex)}`;

            let itemHTML = `<svg class="folder-icon" viewBox="0 0 24 24"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>`;
            const textSpan = document.createElement('span');
            textSpan.className = 'suggestion-text';
            textSpan.innerHTML = highlightedTitle;
            itemEl.innerHTML = itemHTML;
            itemEl.appendChild(textSpan);

            itemEl.addEventListener('click', () => {
                searchInputEl.value = '';
                suggestionsDropdownEl.style.display = 'none';
                activeSuggestionIndex = -1;
                closeAllPopups();
                closeInlineVideoPlayer(true);

                let highlightId;
                let targetSectionRow = null;

                const sampleItemInFolder = allContentData.find(i => i.folderTitle === item.title);
                const categoryKey = sampleItemInFolder ? (Object.keys(appConfig.categoryDetails).find(key => {
                    const dataKey = appConfig.categoryDetails[key].dataKey;
                    return sampleItemInFolder[dataKey];
                }) || 'all') : 'all';

                currentSection = categoryKey;
                setActiveNavLink(document.querySelector(`.nav-link[data-section="${categoryKey}"]`));
                
                if (item.type === 'content') {
                    navigationPath = [item.folderTitle, item.subFolderTitle || ''];
                    currentView = 'subfolder';
                    highlightId = item.id;
                } else { // For grid_folder, horizontal_folder, or folder
                    navigationPath = [];
                    currentView = 'category';
                    if (item.type === 'horizontal_folder') {
                        targetSectionRow = item.title;
                    } else {
                        highlightId = `folder-${item.title}`;
                    }
                }
                
                renderContent();

                setTimeout(() => {
                    let elementToHighlight = null;
                    if (highlightId) {
                        elementToHighlight = document.querySelector(`.list-item-card[data-item-id="${highlightId}"]`);
                    } else if (targetSectionRow) {
                        document.querySelectorAll('.section-row-title').forEach(titleEl => {
                            if (titleEl.textContent.trim() === targetSectionRow) {
                                elementToHighlight = titleEl.closest('.section-row');
                            }
                        });
                    }

                    if (elementToHighlight) {
                        elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const highlightClass = elementToHighlight.classList.contains('section-row') ? 'highlighted-row' : 'highlighted-item';
                        elementToHighlight.classList.add(highlightClass);
                        setTimeout(() => elementToHighlight.classList.remove(highlightClass), 2500);
                    }
                }, ANIMATION_DURATION + 100);
            });

            suggestionsDropdownEl.appendChild(itemEl);
        });
        suggestionsDropdownEl.style.display = 'block';
    } else {
        suggestionsDropdownEl.style.display = 'none';
    }
}


async function fetchDataFromSheet() {
    if (isFetchingSheet) return;
    if (!appConfig.googleSheetApiKey || !appConfig.sheetId || !Array.isArray(appConfig.sheetNames) || appConfig.sheetNames.length === 0) {
        showError("Application configuration for Google Sheets is missing or invalid.");
        return;
    }
    isFetchingSheet = true;
    showLoader(true);
    const fetchPromises = appConfig.sheetNames.map(sheetName => {
        const range = `${sheetName}!A:AG`; 
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${appConfig.sheetId}/values/${range}?key=${appConfig.googleSheetApiKey}&majorDimension=ROWS`;
        return fetch(url).then(res => {
            if (!res.ok) { return res.json().then(errorData => { throw new Error(`API Error (${res.status}) for sheet '${sheetName}': ${errorData.error?.message || res.statusText}`); }); }
            return res.json().then(data => ({ sheetName, data }));
        });
    });
    try {
        const results = await Promise.allSettled(fetchPromises);
        let newAllContentData = [];
        let newWebsiteLinks = [];
        let newSplashMediaItems = [];
        let settingsApplied = false;
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { sheetName, data } = result.value;
                if (data.values && data.values.length > 0) {
                    if (!settingsApplied && sheetName === appConfig.sheetNames[0]) {
                        const settingsRow = data.values[1] || [];
                        headerImageUrl = (settingsRow[COL.HEADER_IMG_URL] || "").trim();
                        initializeAppUI(); 
                        settingsApplied = true;
                    }
                    data.values.slice(2).forEach((row, index) => {
                        if (!Array.isArray(row)) return;
                        
                        const splashUrl = (row[COL.SPLASH_MEDIA_URL] || "").trim();
                        if (splashUrl) { newSplashMediaItems.push({ mediaUrl: splashUrl }); }

                        const websiteName = String(row[COL.WEBSITE_NAME] || '').trim();
                        const websiteUrl = String(row[COL.WEBSITE_LINK] || '').trim();
                        if (websiteName && websiteUrl && !newWebsiteLinks.find(l => l.url === websiteUrl)) {
                            newWebsiteLinks.push({ name: websiteName, url: websiteUrl });
                        }
                        
                        const title = String(row[COL.TITLE] || '').trim();
                        const liveTVName = String(row[COL.LIVE_TV_NAME] || '').trim();
                        
                        if (title) { 
                            const rawFolderTitle = String(row[COL.FOLDER_TITLE] || '').trim();
                            const folderParts = rawFolderTitle.split(',').map(s => s.trim());
                            const folderTitleClean = folderParts[0];
                            const folderBannerUrl = folderParts.length > 1 && folderParts[1] ? folderParts[1] : null;
    
                            const rawSubFolderTitle = String(row[COL.SUB_FOLDER_TITLE] || '').trim();
                            const subFolderParts = rawSubFolderTitle.split(',').map(s => s.trim());
                            const subFolderTitleClean = subFolderParts[0];
                            const subFolderBannerUrl = subFolderParts.length > 1 && subFolderParts[1] ? subFolderParts[1] : null;
    
                            const uniqueId = `item-${sheetName.replace(/\s/g, '_')}-${index + 2}`;
                            let logoUrl = String(row[COL.LOGO_URL] || '').trim();
                            
                            
                            const qualityOptions = [];
                            const seenUrls = new Set();
                            
                            const parseQuality = (rawString, defaultLabel) => {
                                if (!rawString || !rawString.trim()) return null;
                                const parts = rawString.split(',');
                                const url = (parts[0] || '').trim();
                                if (!url) return null;
                                const label = (parts.length > 1 && parts[1].trim()) ? parts[1].trim() : defaultLabel;
                                return { url, label };
                            };

                            const qualityLow = parseQuality(String(row[COL.QUALITY_LOW_URL] || ''), 'Low');
                            const qualityMedium = parseQuality(String(row[COL.QUALITY_MEDIUM_URL] || ''), 'Medium');
                            const qualityHigh = parseQuality(String(row[COL.QUALITY_HIGH_URL] || ''), 'High');
                            
                            if (qualityLow && !seenUrls.has(qualityLow.url)) {
                                qualityOptions.push(qualityLow);
                                seenUrls.add(qualityLow.url);
                            }
                            if (qualityMedium && !seenUrls.has(qualityMedium.url)) {
                                qualityOptions.push(qualityMedium);
                                seenUrls.add(qualityMedium.url);
                            }
                            if (qualityHigh && !seenUrls.has(qualityHigh.url)) {
                                qualityOptions.push(qualityHigh);
                                seenUrls.add(qualityHigh.url);
                            }

                            let streamUrlFallback = String(row[COL.STREAM_URL] || '').trim() || null;
                            if (streamUrlFallback && !seenUrls.has(streamUrlFallback)) {
                                qualityOptions.unshift({ label: "Auto", url: streamUrlFallback });
                            }

                            if (!streamUrlFallback && qualityOptions.length > 0) {
                                streamUrlFallback = qualityOptions[0].url;
                            }
                            

                            const downloadOptions = [];
                            const parseDownloadOption = (rawString, defaultLabel) => {
                                if (!rawString || !rawString.trim()) return null;
                                const parts = rawString.split(',');
                                const url = (parts[0] || '').trim();
                                if (!url) return null;
                                const label = (parts.length > 1 && parts[1].trim()) ? parts[1].trim() : defaultLabel;
                                return { url, label };
                            };

                            const download480p = parseDownloadOption(String(row[COL.DOWNLOAD_URL_480P] || ''), '480p');
                            const download720p = parseDownloadOption(String(row[COL.DOWNLOAD_URL_720P] || ''), '720p');
                            const download1080p = parseDownloadOption(String(row[COL.DOWNLOAD_URL_1080P] || ''), '1080p');
                            
                            if (download480p) downloadOptions.push(download480p);
                            if (download720p) downloadOptions.push(download720p);
                            if (download1080p) downloadOptions.push(download1080p);
                            
                            const hasNoStream = !streamUrlFallback && qualityOptions.length === 0;
                            const isMaintenanceFromSheet = String(row[COL.IS_MAINTENANCE] || '').toUpperCase() === 'TRUE';
                            const isMaintenanceFinal = isMaintenanceFromSheet || hasNoStream;

                            if (isMaintenanceFinal && (!logoUrl || logoUrl === DEFAULT_SVG_ICON_DATA_URI) ) { logoUrl = OFFLINE_IMAGE_URL; } else if (!logoUrl) { logoUrl = DEFAULT_SVG_ICON_DATA_URI; }
                            
                            const badgeTextRaw = String(row[COL.BADGE_TEXT] || '').trim();
                            const badgeTexts = badgeTextRaw ? badgeTextRaw.split(',').map(b => b.trim()).filter(Boolean) : [];

                            newAllContentData.push({
                                id: uniqueId, title, streamUrlFallback, logoUrl, qualityOptions, downloadOptions,
                                isMovie: String(row[COL.IS_MOVIE] || '').toUpperCase() === 'TRUE',
                                isSeries: String(row[COL.IS_SERIES] || '').toUpperCase() === 'TRUE',
                                isAnime: String(row[COL.IS_ANIME] || '').toUpperCase() === 'TRUE',
                                isAnimation: String(row[COL.IS_ANIMATION] || '').toUpperCase() === 'TRUE',
                                isLiveTV: false,
                                isTrending: String(row[COL.IS_TRENDING] || '').toUpperCase() === 'TRUE',
                                requiresVpn: String(row[COL.REQUIRES_VPN] || '').toUpperCase() === 'TRUE',
                                isMaintenance: isMaintenanceFinal,
                                watermarkLogoUrl: String(row[COL.WATERMARK_LOGO_URL] || '').trim() || null,
                                loaderAnimationUrl: String(row[COL.LOADER_ANIMATION_URL] || '').trim() || null,
                                folderTitle: folderTitleClean,
                                folderBannerUrl: folderBannerUrl,
                                subFolderTitle: subFolderTitleClean,
                                subFolderBannerUrl: subFolderBannerUrl,
                                badgeTexts: badgeTexts,
                                badgeText: badgeTexts.length > 0 ? badgeTexts[0] : '',
                                ratingText: String(row[COL.RATING] || '').trim(),
                                liveTVFolderTitle: ''
                            });

                        } else if (liveTVName) { 
                             const liveTVUniqueId = `livetv-${sheetName.replace(/\s/g, '_')}-${index + 2}`;
                             const liveStreamUrl = String(row[COL.LIVE_TV_STREAM_URL] || '').trim();
                             const isMaintenanceLive = String(row[COL.LIVE_TV_MAINTENANCE] || '').toUpperCase() === 'TRUE' || !liveStreamUrl;

                             newAllContentData.push({
                                id: liveTVUniqueId,
                                title: liveTVName,
                                logoUrl: String(row[COL.LIVE_TV_LOGO_URL] || '').trim() || DEFAULT_SVG_ICON_DATA_URI,
                                streamUrlFallback: liveStreamUrl,
                                watermarkLogoUrl: String(row[COL.LIVE_TV_WATERMARK_URL] || '').trim() || null,
                                loaderAnimationUrl: String(row[COL.LIVE_TV_LOADER_URL] || '').trim() || null,
                                isMaintenance: isMaintenanceLive,
                                isLiveTV: true,
                                liveTVFolderTitle: String(row[COL.LIVE_TV_FOLDER_TITLE] || '').trim() || 'Live TV Channels',
                                isMovie: false, isSeries: false, isAnime: false, isAnimation: false, qualityOptions: [], downloadOptions: [],
                                folderTitle: '', subFolderTitle: '', badgeTexts: [], badgeText: '', ratingText: '', requiresVpn: false, isTrending: false
                            });
                        }
                    });
                }
            } else if (result.status === 'rejected') { console.warn(`Failed to fetch or process sheet:`, result.reason.message || result.reason); }
        });
        allContentData = newAllContentData;
        websiteLinks = newWebsiteLinks;
        splashMediaItems = newSplashMediaItems;
        if (allContentData.length === 0 && websiteLinks.length === 0 && splashMediaItems.length === 0) {
            showError("No content or website links found in any of the specified sheets.");
        } else {
            uniqueFolderTitles = [...new Set(allContentData.map(item => item.folderTitle).filter(Boolean))].sort((a,b) => a.localeCompare(b));
            saveDataToCache();
            renderContent();
        }
    } catch (error) {
        showError(`A critical error occurred during data fetch: ${error.message}. Displaying cached data if available.`);
        if (allContentData.length > 0) renderContent();
    } finally {
        showLoader(false);
        isFetchingSheet = false;
    }
}
function proceedToPlayOrQualitySelect(item) {
    if (!item) { 
        document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); 
        return; 
    }
    if (item.isMaintenance) {
        openPlayerInMaintenanceMode(item);
        return;
    }

    if(item.isLiveTV) {
        openInlineVideoPlayer(item.streamUrlFallback, item.title, item);
        return;
    }

    const uniqueQualities = item.qualityOptions ? item.qualityOptions.filter(q => q.url && q.label) : [];

    // UPDATED to handle Continue Watching logic
    let startTime = 0;
    if (watchHistory[item.id]) {
        const historyData = watchHistory[item.id];
        // Only resume if quality was 'Auto' or not specified (backwards compatibility)
        if (historyData.quality === 'Auto' || historyData.quality === 'Standard' || !historyData.quality) {
            startTime = historyData.currentTime;
        } else {
            // If a specific quality was used, it will restart from 0, and we clear the progress
            delete watchHistory[item.id];
            saveWatchHistory();
        }
    }

    if (uniqueQualities.length > 1) { 
        openQualityPopup(item, uniqueQualities, startTime); // Pass startTime to quality popup
    } else if (uniqueQualities.length === 1) { 
        openInlineVideoPlayer(uniqueQualities[0].url, item.title, item, startTime, uniqueQualities[0].label); 
    } else if (item.streamUrlFallback) { 
        openInlineVideoPlayer(item.streamUrlFallback, item.title, item, startTime, "Auto");
    } else { 
        document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); 
        showError(`No playable video source found for "${item.title}".`); 
        if (triggerElement) triggerElement.focus(); 
    } 
}


function createListItemCard(itemData, options = {}) {
    const { isFeaturedItem = false, isHistoryItem = false, isFolder = false, folderItemCount = 0, bannerUrl = null, isLiveTV = false } = options;
    const listItem = document.createElement("div");
    listItem.className = "list-item-card";
    listItem.dataset.itemId = itemData.id;
    if(isFeaturedItem) listItem.classList.add("featured-item");
    if(isFolder) listItem.classList.add("is-folder");
    if(isLiveTV) listItem.classList.add("is-live-tv");

    let currentLogoUrl;
    let imgClass = "thumbnail";

    if (isFolder) {
        if (bannerUrl) {
            currentLogoUrl = bannerUrl;
        } else {
            currentLogoUrl = DEFAULT_FOLDER_ICON_URL;
            imgClass += " is-default-folder-icon";
        }
    } else {
        currentLogoUrl = itemData.logoUrl;
        if (itemData.isMaintenance && (itemData.logoUrl === DEFAULT_SVG_ICON_DATA_URI || !itemData.logoUrl)) {
            currentLogoUrl = OFFLINE_IMAGE_URL;
            imgClass += " is-offline-icon";
        } else if (itemData.logoUrl === DEFAULT_SVG_ICON_DATA_URI) {
            imgClass += " is-svg-icon";
        }
    }
    
    const thumbnailOnError = `this.onerror=null; this.src='${DEFAULT_SVG_ICON_DATA_URI}'; this.alt='Image load error'; this.classList.add('is-svg-icon');`;
    const badgeHTML = itemData.badgeTexts && itemData.badgeTexts.length > 0 && !isFolder 
        ? `<div class="item-badge">${itemData.badgeTexts[0]}</div>` 
        : '';
    const ratingHTML = itemData.ratingText && !isFolder ? `<div class="item-rating-badge">⭐ <span class="rating-text">${itemData.ratingText}</span></div>` : '';
    const viewsHTML = !isFeaturedItem && !isFolder ? `<div class="item-views-badge" data-item-id="${itemData.id}"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg><span class="view-count">0</span></div>` : '';
    const titleText = itemData.title;
    const titleHTML = `<div class="title" title="${titleText}">${titleText}</div>`;
    
    const maintenanceIconHTML = itemData.isMaintenance ? `
        <div class="maintenance-icon-overlay">
            <svg viewBox="0 0 24 24"><path d="M20.7,7.2C20.6,7.1,20.5,7,20.4,7h-2.1c-0.2-1.3-0.7-2.6-1.5-3.6c0,0-0.1,0-0.1-0.1c-0.6-0.8-1.4-1.4-2.3-1.9 c-0.5-0.2-1-0.4-1.5-0.5C12.8,1,12.7,1,12.6,1c-0.4,0-0.8,0.1-1.2,0.2C11,1.3,10.6,1.4,10.2,1.6c-0.9,0.4-1.7,1-2.3,1.8 c0,0,0,0-0.1,0.1C7,4.4,6.4,5.7,6.2,7H4.1C4,7,3.9,7.1,3.8,7.2c-0.1,0.1-0.2,0.3-0.1,0.5l1,3.5c0,0.1,0.1,0.2,0.2,0.3 c0.1,0.1,0.2,0.1,0.4,0.1h1.4c-0.2,1.2-0.1,2.5,0.4,3.7c0,0,0,0,0,0c0.1,0.3,0.2,0.6,0.4,0.9c0.4,0.8,1,1.5,1.8,2 c0.3,0.2,0.6,0.4,1,0.6c0.4,0.2,0.8,0.3,1.2,0.4c0.4,0.1,0.8,0.1,1.2,0c0,0,0-0.1,1.2-0.2c0.7-0.2,1.4-0.6,2-1.1 c1.2-1,2-2.4,2.2-4h1.4c0.1,0,0.3-0.1,0.4-0.1c0.1-0.1,0.2-0.2,0.2-0.3l1-3.5C20.9,7.5,20.8,7.3,20.7,7.2z M12,14 c-1.1,0-2-0.9-2-2c0-1.1,0.9-2,2-2s2,0.9,2,2C14,13.1,13.1,14,12,14z"></path></svg>
            <span>Maintenance</span>
        </div>` : '';

    const liveBadgeHTML = itemData.isLiveTV && !itemData.isMaintenance ? `<div class="live-badge-card">LIVE</div>` : '';

    const likeDislikeHTML = !isFeaturedItem && !isFolder ? `
        <div class="like-dislike-container">
            <button class="vote-btn like-btn" aria-label="Like" data-item-id="${itemData.id}">
                <svg class="like-icon-outline" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"></path></svg>
                <svg class="like-icon-filled" style="display:none;" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"></path></svg>
                <span class="count like-count">0</span>
            </button>
            <button class="vote-btn dislike-btn" aria-label="Dislike" data-item-id="${itemData.id}">
                <svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41-.17-.79-.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path></svg>
                <span class="count dislike-count">0</span>
            </button>
        </div>` : '';
    
    const infoSectionHTML = !isFeaturedItem ? `
        <div class="info">
            <div class="info-top">${titleHTML}</div>
            ${likeDislikeHTML}
        </div>` : '';

    const overlayHTML = `<div class="thumbnail-overlay"><div class="overlay-loader"></div></div>`;
    const historyProgressHTML = isHistoryItem ? `<div class="history-progress-bar"></div>` : '';
    const removeHistoryBtnHTML = isHistoryItem ? `<button class="remove-history-btn" aria-label="Remove from history">&times;</button>` : '';
    const playingIndicatorHTML = `<div class="playing-indicator"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>`;
    
    listItem.innerHTML = `
        ${badgeHTML} 
        ${removeHistoryBtnHTML} 
        <div class="thumbnail-wrapper"> 
            ${liveBadgeHTML}
            ${maintenanceIconHTML}
            <img src="${currentLogoUrl}" alt="${itemData.title || 'Thumbnail'}" class="${imgClass}" loading="lazy" onerror="${thumbnailOnError}"> 
            ${overlayHTML} 
            ${historyProgressHTML} 
            ${ratingHTML} 
            ${viewsHTML} 
            ${playingIndicatorHTML}
        </div> 
        ${infoSectionHTML}`;
    
    if(isHistoryItem && watchHistory[itemData.id]){ const historyData = watchHistory[itemData.id]; const progressPercent = (historyData.currentTime / historyData.duration) * 100; const progressBarEl = listItem.querySelector('.history-progress-bar'); if(progressBarEl) progressBarEl.style.width = `${progressPercent}%`; }
    
    if (!isFeaturedItem) { 
        listItem.setAttribute("role", "button");
        listItem.tabIndex = 0;
        
        const handleItemClick = (e) => { 
            if (e && (e.target.closest('.remove-history-btn') || e.target.closest('.like-dislike-container'))) return;
            
            if (isFolder) {
                navigationPath.push(itemData.title);
                currentView = navigationPath.length === 1 ? 'folder' : 'subfolder';
                renderContent();
            } else {
                document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); 
                listItem.classList.add('clicked-to-play'); 
                currentPopupItem = itemData; 
                triggerElement = listItem; 
                proceedToPlayOrQualitySelect(itemData);
            }
        };

        listItem.addEventListener("click", handleItemClick);
        listItem.addEventListener("keypress", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleItemClick(e); } });

        const removeBtn = listItem.querySelector('.remove-history-btn');
        if (removeBtn) { removeBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); if (watchHistory[itemData.id]) { delete watchHistory[itemData.id]; saveWatchHistory(); renderContent(); } }); }
        
        if(db && !isFolder) { 
            const likeBtn = listItem.querySelector('.like-btn');
            const dislikeBtn = listItem.querySelector('.dislike-btn');
            if(likeBtn) likeBtn.addEventListener('click', (e) => { e.stopPropagation(); window.handleVote(itemData.id, 'like'); });
            if(dislikeBtn) dislikeBtn.addEventListener('click', (e) => { e.stopPropagation(); window.handleVote(itemData.id, 'dislike'); });
            window.loadLikeDislikeCounts(itemData.id); 
            if (!isFeaturedItem) { window.loadViewCount(itemData.id); }
        }
    } else { 
        listItem.tabIndex = -1; 
    } 
    return listItem; 
}

function renderContinueWatching() {
    const historyItems = Object.entries(watchHistory)
        .sort(([, a], [, b]) => b.lastWatched - a.lastWatched)
        .map(([id, data]) => ({ id, ...data }));
    const existingSection = document.getElementById('continueWatchingSection');
    if (existingSection) existingSection.remove();
    if (historyItems.length > 0) {
        const sectionContainer = document.createElement('div');
        sectionContainer.id = 'continueWatchingSection';
        sectionContainer.className = 'section-row';
        const titleEl = document.createElement('h3');
        titleEl.className = 'section-row-title';
        
        const titleText = document.createElement('span');
        titleText.textContent = 'Continue Watching';
        titleEl.appendChild(titleText);

        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearHistoryBtn';
        clearBtn.setAttribute('aria-label', 'Clear all watch history');
        clearBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
        clearBtn.onclick = () => {
            watchHistory = {};
            saveWatchHistory();
            renderContent();
            showCustomToast('history is clear successful', 'success');
        };
        titleEl.appendChild(clearBtn);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'section-row-items';
        historyItems.forEach(historyItem => {
            const itemData = allContentData.find(d => d.id === historyItem.id);
            if (itemData && !itemData.isLiveTV) {
                const card = createListItemCard(itemData, { isHistoryItem: true });
                itemsContainer.appendChild(card);
            }
        });
        if (itemsContainer.children.length > 0) {
            sectionContainer.appendChild(titleEl);
            sectionContainer.appendChild(itemsContainer);
            allCategoriesViewElementsContainer.prepend(sectionContainer);
        }
    }
}
// MAIN RENDER DISPATCHER
function renderContent(options = {}) {
    if (isTransitioning) return;
    isTransitioning = true;

    if (!appConfig.categoryDetails) { 
        console.warn("Category details not loaded."); 
        isTransitioning = false;
        return; 
    }
    
    const currentVisibleContainer = allCategoriesViewElementsContainer.classList.contains('content-visible')
        ? allCategoriesViewElementsContainer
        : (contentListContainer.classList.contains('content-visible') ? contentListContainer : null);

    const renderNewContent = () => {
        allCategoriesViewElementsContainer.innerHTML = "";
        contentListContainer.innerHTML = "";
        allCategoriesViewElementsContainer.classList.remove('content-visible', 'content-fade-out');
        contentListContainer.classList.remove('content-visible', 'content-fade-out');
        hideError();
        showEmptyState(false);
        scrollableContentAreaEl.scrollTop = 0; 

        updateSectionHeader();

        if (currentView === 'category') {
            renderCategoryView(options);
        } else if (currentView === 'folder') {
            renderFolderView(options);
        } else if (currentView === 'subfolder') {
            renderSubFolderView(options);
        }

        updatePlayingIndicator(currentPlayingCardId);
        
        const newVisibleContainer = (currentSection === 'all' && currentView === 'category')
            ? allCategoriesViewElementsContainer
            : contentListContainer;
        
        newVisibleContainer.classList.add('content-visible');
    };

    if (currentVisibleContainer) {
        currentVisibleContainer.classList.add('content-fade-out');
        setTimeout(() => {
            renderNewContent();
            isTransitioning = false;
        }, ANIMATION_DURATION);
    } else {
        renderNewContent();
        isTransitioning = false;
    }
}
function renderBannerAd() { 
    const adContainer = document.createElement('div'); 
    adContainer.id = 'bannerAdContainer'; 
    injectBannerAd(adContainer);
    return adContainer; 
}
function renderHomePageContent() {
    renderContinueWatching();
    if (splashMediaItems.length > 0) {
        splashMediaItems.forEach(item => {
            const splashContainer = document.createElement('div');
            splashContainer.className = 'splash-media-container';
            const isVideo = ['.mp4', '.webm', '.mov'].some(ext => item.mediaUrl.toLowerCase().includes(ext));
            let mediaElement;
            if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.autoplay = true;
                mediaElement.loop = true;
                mediaElement.muted = true;
                mediaElement.playsInline = true;
                mediaElement.setAttribute('playsinline', '');
            } else {
                mediaElement = document.createElement('img');
            }
            mediaElement.src = item.mediaUrl;
            mediaElement.className = 'splash-media-element';
            mediaElement.alt = 'Promotional Content';
            splashContainer.appendChild(mediaElement);
            allCategoriesViewElementsContainer.appendChild(splashContainer);
        });
    }

    const trendingItems = allContentData.filter(item => item.isTrending && !item.isMaintenance && !item.isLiveTV);
    if (trendingItems.length > 0) { 
        const trendingPanel = document.createElement('div'); 
        trendingPanel.className = 'trending-panel'; 
        const trendingPanelTitle = document.createElement('h3'); 
        trendingPanelTitle.className = 'trending-panel-title'; 
        trendingPanelTitle.textContent = 'Trending Now'; 
        trendingPanel.appendChild(trendingPanelTitle); 
        const trendingPanelTrack = document.createElement('div'); 
        trendingPanelTrack.className = 'trending-panel-items-track'; 
        
        let itemsForTrendingTrack = shuffleArray([...trendingItems]); 
        
        itemsForTrendingTrack.forEach(itemData => { 
            trendingPanelTrack.appendChild(createListItemCard(itemData, { isFeaturedItem: true })); 
        }); 
        
        if (itemsForTrendingTrack.length > 0) {
            itemsForTrendingTrack.forEach(itemData => { 
                trendingPanelTrack.appendChild(createListItemCard(itemData, { isFeaturedItem: true })); 
            });
        }

        trendingPanel.appendChild(trendingPanelTrack); 
        allCategoriesViewElementsContainer.appendChild(trendingPanel); 
    }
    allCategoriesViewElementsContainer.appendChild(renderBannerAd());
    if (currentUser && currentUser.id) { 
        renderAndAttachCommentsSection(allCategoriesViewElementsContainer); 
    }
    if (websiteLinks.length > 0) { const websitesSection = document.createElement('div'); websitesSection.id = 'ourWebsitesSection'; websitesSection.innerHTML = `<h3>Our Website👨‍💻</h3>`; const linksContainer = document.createElement('div'); linksContainer.className = 'website-links-container'; websiteLinks.forEach(link => { const linkEl = document.createElement('a'); linkEl.href = link.url; linkEl.textContent = link.name; linkEl.className = 'website-link-item'; linkEl.target = '_blank'; linkEl.rel = 'noopener noreferrer'; linksContainer.appendChild(linkEl); }); websitesSection.appendChild(linksContainer); allCategoriesViewElementsContainer.appendChild(websitesSection); }
    if (allCategoriesViewElementsContainer.children.length === 0 && allContentData.length === 0 && !isFetchingSheet && !isFetchingConfig) { showEmptyState(true, "No content or information available."); }
}
function renderCategoryView(options = {}) {
    allCategoriesViewElementsContainer.style.display = 'flex';
    contentListContainer.style.display = 'none';

    if (currentSection === 'all') {
        renderHomePageContent();
        return;
    }

    const currentCatDetail = appConfig.categoryDetails[currentSection];
    if (!currentCatDetail) { showError("Category not found."); return; }

    const filteredData = allContentData.filter(item => item[currentCatDetail.dataKey]);
    if (filteredData.length === 0) {
        showEmptyState(true, `No content in "${currentCatDetail.name}".`);
        return;
    }

    
    if (currentSection === 'isLiveTV') {
        const groupedByFolder = filteredData.reduce((acc, item) => {
            const key = item.liveTVFolderTitle || 'Live TV Channels';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        let folderKeys = Object.keys(groupedByFolder).sort((a, b) => a.localeCompare(b));
        if (options.randomize) {
            folderKeys = shuffleArray(folderKeys);
        }

        folderKeys.forEach(folderTitle => {
            const itemsInFolder = groupedByFolder[folderTitle];
            if (options.randomize) {
                shuffleArray(itemsInFolder);
            }
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'section-row';
            const titleEl = document.createElement('h3');
            titleEl.className = 'section-row-title';
            titleEl.textContent = folderTitle;
            sectionContainer.appendChild(titleEl);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'section-row-items';
            itemsInFolder.forEach(itemData => {
                itemsContainer.appendChild(createListItemCard(itemData, { isLiveTV: true }));
            });
            sectionContainer.appendChild(itemsContainer);
            contentListContainer.appendChild(sectionContainer);
        });
        
        contentListContainer.style.display = 'flex';
        allCategoriesViewElementsContainer.style.display = 'none';
        return;
    }
    

    const groupedByFolder = filteredData.reduce((acc, item) => {
        const key = item.folderTitle || 'no_folder_grid';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    let folderKeys = Object.keys(groupedByFolder).filter(key => key !== 'no_folder_grid').sort((a, b) => a.localeCompare(b));
    let itemsWithoutFolder = groupedByFolder['no_folder_grid'] || [];

    if (options.randomize) {
        folderKeys = shuffleArray(folderKeys);
        itemsWithoutFolder = shuffleArray(itemsWithoutFolder);
    }
    
    folderKeys.forEach(folderTitle => {
        const itemsInFolder = groupedByFolder[folderTitle];
        const hasSubFolders = itemsInFolder.some(item => item.subFolderTitle);
        
        const folderBanner = itemsInFolder.find(item => item.folderBannerUrl)?.folderBannerUrl || null;

        if (hasSubFolders) {
            if (!contentListContainer.querySelector('.folder-grid')) {
                const gridContainer = document.createElement('div');
                gridContainer.className = 'folder-grid';
                contentListContainer.appendChild(gridContainer);
            }
            const folderCard = createListItemCard({ id: `folder-${folderTitle}`, title: folderTitle }, { isFolder: true, folderItemCount: itemsInFolder.length, bannerUrl: folderBanner });
            contentListContainer.querySelector('.folder-grid').appendChild(folderCard);
        } else {
            const HORIZONTAL_ROW_LIMIT = 5;
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'section-row';

            const titleEl = document.createElement('h3');
            titleEl.className = 'section-row-title';
            titleEl.textContent = folderTitle;
            sectionContainer.appendChild(titleEl);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'section-row-items';
            
            let itemsToRender = [...itemsInFolder];
            if (options.randomize) {
                itemsToRender = shuffleArray(itemsToRender);
            }

            const itemsToShow = itemsToRender.length > HORIZONTAL_ROW_LIMIT ? itemsToRender.slice(0, HORIZONTAL_ROW_LIMIT) : itemsToRender;
            
            itemsToShow.forEach(itemData => {
                itemsContainer.appendChild(createListItemCard(itemData));
            });

            if (itemsToRender.length > HORIZONTAL_ROW_LIMIT) {
                const seeMoreCard = document.createElement('div');
                seeMoreCard.className = 'see-more-card';
                seeMoreCard.innerHTML = `
                    <div class="see-more-content">
                        <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>
                        <span>See More</span>
                    </div>`;
                seeMoreCard.onclick = () => {
                    navigationPath = [folderTitle, ''];
                    currentView = 'subfolder';
                    renderContent();
                };
                itemsContainer.appendChild(seeMoreCard);
            }

            sectionContainer.appendChild(itemsContainer);
            contentListContainer.appendChild(sectionContainer);
        }
    });

    if (itemsWithoutFolder.length > 0) {
        if (!contentListContainer.querySelector('.folder-grid')) {
            const gridContainer = document.createElement('div');
            gridContainer.className = 'folder-grid';
            contentListContainer.appendChild(gridContainer);
        }
        itemsWithoutFolder.forEach(itemData => {
            contentListContainer.querySelector('.folder-grid').appendChild(createListItemCard(itemData));
        });
    }
    contentListContainer.style.display = 'flex';
}

function renderFolderView(options = {}) {
    contentListContainer.style.display = 'flex';
    const folderName = navigationPath[0];
    const itemsInFolder = allContentData.filter(item => item.folderTitle === folderName);
    let subFolders = [...new Set(itemsInFolder.map(item => item.subFolderTitle).filter(Boolean))].sort();

    if (subFolders.length === 0) {
        renderSubFolderView(options); 
        return;
    }
    
    if (options.randomize) {
        subFolders = shuffleArray(subFolders);
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'folder-grid';
    subFolders.forEach(subFolderTitle => {
        const itemsInSubFolder = itemsInFolder.filter(i => i.subFolderTitle === subFolderTitle);
        const itemCount = itemsInSubFolder.length;
        const subFolderBanner = itemsInSubFolder.find(item => item.subFolderBannerUrl)?.subFolderBannerUrl || null;
        
        const subFolderCard = createListItemCard({ id: `subfolder-${subFolderTitle}`, title: subFolderTitle }, { isFolder: true, folderItemCount: itemCount, bannerUrl: subFolderBanner });
        gridContainer.appendChild(subFolderCard);
    });
    contentListContainer.appendChild(gridContainer);
}

function renderSubFolderView(options = {}) {
    contentListContainer.style.display = 'flex';
    const [folderName, subFolderName] = navigationPath;
    
    let items = allContentData.filter(item => 
        item.folderTitle === folderName && 
        (subFolderName !== '' ? item.subFolderTitle === subFolderName : true)
    );

    if (items.length === 0) {
        showEmptyState(true, `No content in "${subFolderName || folderName}".`);
        return;
    }
    
    if (options.randomize) {
        items = shuffleArray(items);
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'folder-grid';
    items.forEach(itemData => {
        gridContainer.appendChild(createListItemCard(itemData));
    });
    contentListContainer.appendChild(gridContainer);
}

function updateSectionHeader() {
    if (!appConfig.categoryDetails) return;

    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        const isHomePage = currentSection === 'all' && navigationPath.length === 0;
        searchContainer.classList.toggle('hidden', !isHomePage);
    }

    if (currentSection === 'all' && navigationPath.length === 0) {
        sectionTitleWrapperEl.style.display = 'none';
        allCategoriesViewElementsContainer.style.display = 'flex';
        contentListContainer.style.display = 'none';
        return;
    }
    
    sectionTitleWrapperEl.style.display = 'block';
    allCategoriesViewElementsContainer.style.display = 'none';
    contentListContainer.style.display = 'flex';
    
    if (currentSection !== 'all' && navigationPath.length === 0 && currentView === 'category') {
        refreshSectionBtn.style.display = 'flex';
    } else {
        refreshSectionBtn.style.display = 'none';
    }

    if (navigationPath.length > 0) {
        backBtn.style.display = 'flex';
        sectionTitleIconEl.style.display = 'none';
        sectionTitleEl.textContent = [...navigationPath].filter(Boolean).pop() || 'Content';
    } else {
        backBtn.style.display = 'none';
        const catDetails = appConfig.categoryDetails[currentSection];
        if(catDetails) {
            sectionTitleEl.textContent = catDetails.name;
            sectionTitleIconEl.src = catDetails.icon;
            sectionTitleIconEl.style.display = 'block';
        }
    }
}
function resetNavigation() {
    navigationPath = [];
    currentView = 'category';
    currentSearchTerm = null;
}
function navigateBack() {
    if (navigationPath.length > 0) {
        navigationPath.pop();
        if (navigationPath.length > 0 && navigationPath[navigationPath.length - 1] === '') {
             navigationPath.pop();
        }
        currentView = navigationPath.length > 0 ? 'folder' : 'category';
        
        if(currentView === 'category') {
            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink && activeLink.dataset.section !== currentSection) {
                 currentSection = activeLink.dataset.section;
            }
        }
    }
    renderContent();
}

function handleSectionRefresh() {
    if (refreshSectionBtn) {
        refreshSectionBtn.classList.add('spinning');
        setTimeout(() => refreshSectionBtn.classList.remove('spinning'), 600); // Match animation duration
    }
    renderContent({ randomize: true });
}

function updatePlayingIndicator(playingItemId) {
    if (currentPlayingCardId) {
        document.querySelectorAll(`[data-item-id="${currentPlayingCardId}"]`)
            .forEach(card => card.classList.remove('is-playing'));
    }
    if (playingItemId) {
        document.querySelectorAll(`[data-item-id="${playingItemId}"]`)
            .forEach(card => {
                if (!card.classList.contains('featured-item')) {
                    card.classList.add('is-playing');
                }
            });
    }
    currentPlayingCardId = playingItemId;
}

function populateNowPlayingInfo(itemData, qualityLabel = null) {
    if (!itemData) {
        nowPlayingInfoWrapperEl.style.display = 'none';
        return;
    };
    let displayedSectionName = appConfig.categoryDetails[currentSection]?.name || "Details";
    nowPlayingTitleEl.textContent = itemData.title;
    nowPlayingSectionEl.textContent = displayedSectionName;

    const folderText = itemData.isLiveTV ? itemData.liveTVFolderTitle : (itemData.subFolderTitle ? `${itemData.folderTitle} / ${itemData.subFolderTitle}` : itemData.folderTitle);
    if (folderText) {
        nowPlayingFolderTextEl.textContent = folderText;
        nowPlayingFolderEl.style.display = 'flex';
    } else {
        nowPlayingFolderEl.style.display = 'none';
    }
    
    if (qualityLabel && !itemData.isLiveTV) {
        nowPlayingQualityTextEl.textContent = qualityLabel;
        nowPlayingQualityEl.style.display = 'flex';
    } else {
        nowPlayingQualityEl.style.display = 'none';
    }
    
    const nowPlayingLiveViewsEl = document.getElementById('nowPlayingLiveViews');
    if(nowPlayingLiveViewsEl) {
        nowPlayingLiveViewsEl.style.display = itemData.isLiveTV ? 'flex' : 'none';
    }

    if (itemData.badgeTexts && itemData.badgeTexts.length > 0 && !itemData.isLiveTV) {
        nowPlayingBadgeTextEl.textContent = itemData.badgeTexts[0];
        nowPlayingBadgeEl.style.display = 'inline-block';
    } else {
        nowPlayingBadgeEl.style.display = 'none';
    }

    const existingAdditionalBadges = document.getElementById('nowPlayingAdditionalBadgesContainer');
    if (existingAdditionalBadges) existingAdditionalBadges.remove();

    if (itemData.badgeTexts && itemData.badgeTexts.length > 1) {
        const additionalBadgesContainer = document.createElement('div');
        additionalBadgesContainer.id = 'nowPlayingAdditionalBadgesContainer';
        additionalBadgesContainer.className = 'now-playing-additional-badges-container';
        
        const track = document.createElement('div');
        track.className = 'now-playing-additional-badges-track';

        itemData.badgeTexts.slice(1).forEach(badge => {
            const span = document.createElement('span');
            span.className = 'now-playing-additional-badge';
            span.textContent = badge;
            track.appendChild(span);
        });
        
        additionalBadgesContainer.innerHTML = `<strong>#Tags</strong>`;
        additionalBadgesContainer.appendChild(track);

        const metaContainer = nowPlayingSectionEl.closest('.now-playing-meta');
        if (metaContainer) {
            metaContainer.parentElement.insertBefore(additionalBadgesContainer, metaContainer.nextSibling);
        }
    }

    if (itemData.ratingText && !itemData.isLiveTV) {
        nowPlayingRatingEl.style.display = 'flex';
        nowPlayingRatingTextEl.textContent = itemData.ratingText;
        const ratingValue = parseFloat(itemData.ratingText);
        const maxRating = 10.0;
        const starPercentage = (ratingValue / maxRating) * 100;
        nowPlayingRatingStarsEl.style.width = `${starPercentage}%`;
    } else {
        nowPlayingRatingEl.style.display = 'none';
    }
    nowPlayingWarningEl.style.display = itemData.requiresVpn ? 'flex' : 'none';
    nowPlayingDownloadBtnEl.style.display = itemData.isLiveTV ? 'none' : 'inline-flex';
    nowPlayingDownloadBtnEl.onclick = () => handleDownloadClick(itemData);
    nowPlayingLikesEl.dataset.itemId = itemData.id;
    nowPlayingViewsEl.dataset.itemId = itemData.id;
    if (db && currentUser.id) {
        [nowPlayingLikeBtnEl, nowPlayingDislikeBtnEl].forEach(btn => btn.dataset.itemId = itemData.id);
        nowPlayingLikeBtnEl.onclick = () => window.handleVote(itemData.id, 'like');
        nowPlayingDislikeBtnEl.onclick = () => window.handleVote(itemData.id, 'dislike');
        window.loadLikeDislikeCounts(itemData.id);
        window.loadViewCount(itemData.id);
    }
}

function startLiveViewTracking(channelId) {
    if (!rtdb || !channelId || !currentUser.id) return;
    stopLiveViewTracking(); // Clean up previous one

    const channelPresenceRef = ref(rtdb, `live-presence/${channelId}`);
    currentPresenceRef = ref(rtdb, `live-presence/${channelId}/${currentUser.id}`);
    const liveViewCountEl = document.getElementById('nowPlayingLiveViewCount');

    // Add user to presence list, and set onDisconnect to remove them
    onDisconnect(currentPresenceRef).remove();
    set(currentPresenceRef, true);

    // Listen for changes in the number of viewers
    presenceListenerUnsubscribe = onValue(channelPresenceRef, (snapshot) => {
        const count = snapshot.exists() ? snapshot.size : 0;
        if (liveViewCountEl) {
            liveViewCountEl.textContent = count.toLocaleString('en-US');
        }
    });
}

function stopLiveViewTracking() {
    // Detach the listener
    if (presenceListenerUnsubscribe) {
        presenceListenerUnsubscribe();
        presenceListenerUnsubscribe = null;
    }

    // Manually remove user from presence list when they close the player gracefully
    if (currentPresenceRef) {
        remove(currentPresenceRef);
        currentPresenceRef = null;
    }
}

function openPlayerInMaintenanceMode(itemData) {
    triggerElement = document.activeElement;
    closeInlineVideoPlayer(true); 
    inlinePlayerTitleText.textContent = itemData.title;
    updatePlayingIndicator(itemData.id);
    populateNowPlayingInfo(itemData);
    nowPlayingInfoWrapperEl.style.display = 'block';
    playerAdjacentContentEl.style.display = 'block';
    playerMessageOverlayEl.style.display = 'flex';
    nativeVideoPlayer.style.display = 'none';
    customVideoControls.style.display = 'none';
    playerLoader.classList.remove('visible');
    inlinePlayerWrapper.classList.add("active");
    setLiveTVPlayerMode(itemData.isLiveTV);
    setPlayerWrapperHeight();
    handleControlsVisibility();
}

function setLiveTVPlayerMode(isLiveTV) {
    isCurrentPlayerLiveTV = isLiveTV;
    liveIndicatorEl.style.display = isLiveTV ? 'flex' : 'none';
    const autoplaySwitch = autoplayToggleEl.closest('.autoplay-switch');
    if(autoplaySwitch) {
        autoplaySwitch.style.display = isLiveTV ? 'none' : 'flex';
    }
    if (isLiveTV) {
        appContainerEl.classList.add('live-tv-mode');
    } else {
        appContainerEl.classList.remove('live-tv-mode');
    }
}

async function openInlineVideoPlayer(streamUrl, title, itemToPlay, startTime = 0, qualityLabel = null) { 
    if (!streamUrl) { document.querySelectorAll('.list-item-card.clicked-to-play, .live-tv-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); return showError("Video stream URL missing."); } 
    triggerElement = document.activeElement; 
    if (inlinePlayerWrapper.classList.contains("active") && currentlyPlayingStreamUrl === streamUrl) { return; } 
    closeInlineVideoPlayer(true); 
    inlinePlayerTitleText.textContent = title; 
    currentlyPlayingStreamUrl = streamUrl; 
    updatePlayingIndicator(itemToPlay.id); 
    populateNowPlayingInfo(itemToPlay, qualityLabel);
    nowPlayingInfoWrapperEl.style.display = 'block';
    playerAdjacentContentEl.style.display = 'block';
    populateUpNextSection(itemToPlay);
    
    if (itemToPlay.isLiveTV) {
        startLiveViewTracking(itemToPlay.id);
    }
    
    const playerLikeBtn = document.getElementById('playerLikeBtn');
    const playerDislikeBtn = document.getElementById('playerDislikeBtn');
    if (db && currentUser.id) {
        [playerLikeBtn, playerDislikeBtn].forEach(btn => {
            btn.classList.remove('hidden');
            btn.dataset.itemId = itemToPlay.id;
        });
        playerLikeBtn.onclick = () => window.handleVote(itemToPlay.id, 'like');
        playerDislikeBtn.onclick = () => window.handleVote(itemToPlay.id, 'dislike');
        window.loadLikeDislikeCounts(itemToPlay.id);
    } else {
        [playerLikeBtn, playerDislikeBtn].forEach(btn => btn.classList.add('hidden'));
    }
    playerMessageOverlayEl.style.display = 'none';
    nativeVideoPlayer.style.display = 'block';
    customVideoControls.style.display = 'flex';
    const defaultSpinner = playerLoader.querySelector('.default-spinner'); const customImg = playerLoader.querySelector('.custom-loader-img'); if (itemToPlay.loaderAnimationUrl) { customImg.src = itemToPlay.loaderAnimationUrl; customImg.style.display = 'block'; defaultSpinner.style.display = 'none'; } else { customImg.style.display = 'none'; defaultSpinner.style.display = 'block'; } playerLoader.classList.add('visible'); progressBar.value = 0; progressBar.style.background = `rgba(255, 255, 255, 0.3)`; timeDisplay.textContent = "00:00 / 00:00"; currentScreenFitMode = 'contain'; nativeVideoPlayer.classList.remove('video-mode-cover'); nativeVideoPlayer.classList.add('video-mode-contain'); fillIcon.style.display = 'block'; fitIcon.style.display = 'none'; fitFillBtn.setAttribute('aria-label', 'Switch to Fit Mode'); nativeVideoPlayer.playbackRate = 1; playbackSpeedBtn.textContent = '1x'; inlinePlayerWrapper.classList.add("active"); 
    setLiveTVPlayerMode(itemToPlay.isLiveTV);
    setPlayerWrapperHeight(); 

    isNonAutoQualityPlaying = qualityLabel && qualityLabel !== 'Auto' && qualityLabel !== 'Standard';
    let suggestionShownOnPlay = false;
    
    const onPlayingHandler = () => {
        if (isNonAutoQualityPlaying && !suggestionShownOnPlay) {
            showPlaybackSuggestion("Use double-tap Gesture for a smooth playback experience");
            suggestionShownOnPlay = true;
        }
        // *** FIX: Increment view count for Live TV as soon as it starts playing ***
        if (itemToPlay.isLiveTV) {
            incrementViewCount(itemToPlay.id);
        }
    };
    nativeVideoPlayer.removeEventListener('playing', onPlayingHandler); 
    nativeVideoPlayer.addEventListener('playing', onPlayingHandler);
    
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    if (streamUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            hlsInstance = new Hls();
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(nativeVideoPlayer);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                if (startTime > 0 && isFinite(startTime) && !itemToPlay.isLiveTV) {
                    nativeVideoPlayer.currentTime = startTime;
                }
            });
        } else if (nativeVideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            nativeVideoPlayer.src = streamUrl;
             if (startTime > 0 && isFinite(startTime) && !itemToPlay.isLiveTV) {
                nativeVideoPlayer.currentTime = startTime;
            }
        } else {
            showError('HLS playback is not supported in this browser.');
            return;
        }
    } else {
        nativeVideoPlayer.src = streamUrl;
         if (startTime > 0 && isFinite(startTime) && !itemToPlay.isLiveTV) {
            nativeVideoPlayer.currentTime = startTime;
        }
    }

    if (itemToPlay.watermarkLogoUrl) { nativePlayerWatermarkEl.querySelector('img').src = itemToPlay.watermarkLogoUrl; nativePlayerWatermarkEl.classList.remove('hidden'); } else { nativePlayerWatermarkEl.classList.add('hidden'); } try { 
        await nativeVideoPlayer.play(); 
        handleControlsVisibility(); 
        showBottomBannerAd(); 
    } catch (error) { document.querySelectorAll('.list-item-card.clicked-to-play, .live-tv-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); updatePlayingIndicator(null); console.warn("Player: Autoplay prevented or play interrupted:", error.name, error.message); } 
}
function closeInlineVideoPlayer(calledInternally = false) { 
    stopLiveViewTracking(); // Stop tracking live views
    hideBottomBannerAd();
    isNonAutoQualityPlaying = false;
    if (suggestionTimeout) clearTimeout(suggestionTimeout);
    if (playbackSuggestionOverlayEl) playbackSuggestionOverlayEl.classList.remove('visible');
    
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    setLiveTVPlayerMode(false);
    nowPlayingInfoWrapperEl.style.display = 'none';
    nowPlayingQualityEl.style.display = 'none';
    playerAdjacentContentEl.style.display = 'none';
    upNextContainerEl.style.display = 'none';
    upNextItemsEl.innerHTML = '';
    const existingAdditionalBadges = document.getElementById('nowPlayingAdditionalBadgesContainer');
    if (existingAdditionalBadges) existingAdditionalBadges.remove();

    hideNextPlayNotification();
    if (nativeVideoPlayer) { nativeVideoPlayer.pause(); nativeVideoPlayer.removeAttribute('src'); nativeVideoPlayer.load(); nativeVideoPlayer.poster = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } 
    if(nativePlayerWatermarkEl) nativePlayerWatermarkEl.classList.add('hidden'); 
    playerLoader.classList.remove('visible'); 
    const customImg = playerLoader.querySelector('.custom-loader-img'); 
    if (customImg) customImg.src = ''; 
    clearTimeout(inactivityTimeout); 
    document.querySelectorAll('.list-item-card.clicked-to-play, .live-tv-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play')); 
    updatePlayingIndicator(null); 
    inlinePlayerWrapper.classList.remove("active"); 
    setPlayerWrapperHeight(); 
    inlinePlayerTitleText.textContent = "Video Title"; 
    currentlyPlayingStreamUrl = null; 
    playerMessageOverlayEl.style.display = 'none';
    nowPlayingWarningEl.style.display = 'none';
    nativeVideoPlayer.style.display = 'block';
    customVideoControls.style.display = 'flex';
    if (!calledInternally && triggerElement) { triggerElement.focus(); triggerElement = null; } else if (!calledInternally && customPlayerCloseBtn) { customPlayerCloseBtn.focus(); } 
}
function setPlayerWrapperHeight() { 
    if (!inlinePlayerWrapper) return; 
    const titleBarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--title-bar-height')); 
    
    if (!inlinePlayerWrapper.classList.contains('active')) { 
        inlinePlayerWrapper.style.height = getComputedStyle(document.documentElement).getPropertyValue('--player-wrapper-height-collapsed'); 
        return; 
    } 

    let targetPlayerWrapperHeightStyle = getComputedStyle(document.documentElement).getPropertyValue('--player-wrapper-active-height').trim(); 
    let targetPlayerWrapperHeight; 

    if (targetPlayerWrapperHeightStyle.endsWith('vh')) { 
        targetPlayerWrapperHeight = parseFloat(targetPlayerWrapperHeightStyle) / 100 * window.innerHeight; 
    } else if (targetPlayerWrapperHeightStyle.endsWith('px')) { 
        targetPlayerWrapperHeight = parseFloat(targetPlayerWrapperHeightStyle); 
    } else { 
        targetPlayerWrapperHeight = (window.innerHeight * 0.5); 
    } 

    const minVideoHeight = 150; 
    const mainContentAreaMaxHeight = window.innerHeight - (appHeaderEl ? appHeaderEl.offsetHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))); 
    const sectionTitleWrapperActualHeight = sectionTitleWrapperEl && sectionTitleWrapperEl.style.display !== 'none' ? sectionTitleWrapperEl.offsetHeight : 0; 
    const minScrollableAreaHeight = 100; 
    
    if (targetPlayerWrapperHeight > (mainContentAreaMaxHeight - sectionTitleWrapperActualHeight - minScrollableAreaHeight)) { 
        targetPlayerWrapperHeight = mainContentAreaMaxHeight - sectionTitleWrapperActualHeight - minScrollableAreaHeight; 
    } 
    
    if (targetPlayerWrapperHeight < minVideoHeight ) { 
        targetPlayerWrapperHeight = minVideoHeight; 
    } 
    
    if (targetPlayerWrapperHeight < 0) targetPlayerWrapperHeight = 0; 
    
    inlinePlayerWrapper.style.height = `${targetPlayerWrapperHeight}px`; 
    
    const videoContainerEl = inlinePlayerWrapper.querySelector('.video-container'); 
    if (videoContainerEl) { 
        videoContainerEl.style.height = `calc(100% - ${titleBarHeight}px)`; 
    } 
}

function openInfoPopup(itemData, sectionName) {
    if (!infoPopupOverlay) return;
    triggerElement = document.activeElement;
    currentPopupItem = itemData;
    infoPopupBannerImg.src = itemData.logoUrl;
    infoPopupBannerImg.onerror = () => { infoPopupBannerImg.src = DEFAULT_SVG_ICON_DATA_URI; };
    infoPopupTitleEl.textContent = itemData.title;
    infoPopupSectionEl.textContent = sectionName;
    
    if (itemData.badgeTexts && itemData.badgeTexts.length > 0) {
        infoPopupBadgeTextEl.textContent = itemData.badgeTexts[0];
        infoPopupBadgeEl.style.display = 'block';
    } else { infoPopupBadgeEl.style.display = 'none'; }

    const cardElement = document.querySelector(`.list-item-card[data-item-id="${itemData.id}"]`);
    if (cardElement && db && currentUser.id) {
        infoPopupLikesEl.style.display = 'flex';
        infoPopupViewsEl.style.display = 'flex';
        infoPopupVoteContainer.style.display = 'flex';
        infoPopupLikeBtn.dataset.itemId = itemData.id;
        infoPopupDislikeBtn.dataset.itemId = itemData.id;
        window.loadLikeDislikeCounts(itemData.id); 
        window.loadViewCount(itemData.id);
    } else {
         infoPopupLikesEl.style.display = 'none';
         infoPopupViewsEl.style.display = 'none';
         infoPopupVoteContainer.style.display = 'none';
    }
    if (itemData.ratingText) {
        infoPopupRatingEl.style.display = 'flex';
        infoPopupRatingTextEl.textContent = itemData.ratingText;
        const ratingValue = parseFloat(itemData.ratingText);
        const maxRating = 10.0;
        const starPercentage = (ratingValue / maxRating) * 100;
        infoPopupRatingStarsEl.style.width = `${starPercentage}%`;
    } else { infoPopupRatingEl.style.display = 'none'; }
    infoPopupStatusMessageEl.classList.remove('maintenance', 'vpn-required');
    if (itemData.isMaintenance) {
        infoPopupStatusMessageEl.innerHTML = "<strong>Note:</strong> This content is currently under maintenance and cannot be played.";
        infoPopupStatusMessageEl.classList.add('maintenance');
        infoPopupStatusMessageEl.style.display = 'block';
    } else if (itemData.requiresVpn) {
        infoPopupStatusMessageEl.innerHTML = "<strong>Note:</strong> This content requires a secure connection. Please use a VPN.";
        infoPopupStatusMessageEl.classList.add('vpn-required');
        infoPopupStatusMessageEl.style.display = 'block';
    } else { infoPopupStatusMessageEl.style.display = 'none'; }
    infoPopupDownloadBtn.style.display = 'inline-flex';
    infoPopupDownloadBtn.onclick = () => handleDownloadClick(itemData);
    infoPopupOverlay.classList.add('visible');
    if (infoPopupCloseBtn) infoPopupCloseBtn.focus();
}
function closeInfoPopup(calledInternally = false) { if (!infoPopupOverlay) return; infoPopupOverlay.classList.remove('visible'); currentPopupItem = null; if (infoPopupLikeBtn) { infoPopupLikeBtn.onclick = null; infoPopupLikeBtn.dataset.itemId = ''; } if (infoPopupDislikeBtn) { infoPopupDislikeBtn.onclick = null; infoPopupDislikeBtn.dataset.itemId = ''; } if (infoPopupDownloadBtn) { infoPopupDownloadBtn.onclick = null; infoPopupDownloadBtn.style.display = 'none'; } if (!calledInternally && triggerElement) { triggerElement.focus(); triggerElement = null; } }

function openQualityPopup(itemData, qualitiesToDisplay, startTime = 0) {
    if (!qualityPopupOverlay || !qualityOptionsContainer || !itemData || itemData.isMaintenance) return;
    triggerElement = document.activeElement;
    currentPopupItem = itemData;
    
    
    if (qualityPopupTitleEl) {
        qualityPopupTitleEl.innerHTML = `Select Your Stream for watching <br><span class="quality-item-name">${escapeHTML(itemData.title)}</span>`;
    }

    qualityOptionsContainer.innerHTML = '';
    
    if (!qualitiesToDisplay || qualitiesToDisplay.length === 0) {
        if(itemData.streamUrlFallback) {
            openInlineVideoPlayer(itemData.streamUrlFallback, itemData.title, itemData, startTime, "Auto");
        } else {
            document.querySelectorAll('.list-item-card.clicked-to-play').forEach(card => card.classList.remove('clicked-to-play'));
            showError("No quality options available.");
        }
        closeQualityPopup(true);
        return;
    }

    qualitiesToDisplay.forEach((quality, index) => {
        const btn = document.createElement('button');
        btn.className = 'quality-option-btn';
        btn.textContent = quality.label;
        btn.onclick = () => {
            closeQualityPopup(true);
            // If a specific quality is chosen, start from 0 unless it's auto
            const finalStartTime = (quality.label === 'Auto' || quality.label === 'Standard') ? startTime : 0;
            openInlineVideoPlayer(quality.url, itemData.title, itemData, finalStartTime, quality.label);
        };
        qualityOptionsContainer.appendChild(btn);
        if (index === 0) {
            setTimeout(() => btn.focus(), 0);
        }
    });
    qualityPopupOverlay.classList.add('visible');
    if (qualitiesToDisplay.length === 0 && qualityPopupCloseBtn) {
        qualityPopupCloseBtn.focus();
    }
}
function closeQualityPopup(calledInternally = false) { if (!qualityPopupOverlay) return; qualityPopupOverlay.classList.remove('visible'); if (!calledInternally && currentPopupItem && triggerElement && !nativeVideoPlayer.src) { triggerElement.classList.remove('clicked-to-play'); } if (!calledInternally && triggerElement) { if (!nativeVideoPlayer.src) { triggerElement.focus(); } else { if(videoContainer) videoContainer.focus(); } } }
function openDownloadQualityPopup(itemData, qualitiesToDisplay) { if (!downloadQualityPopupOverlay || !downloadQualityOptionsContainer) return; triggerElement = document.activeElement; currentPopupItem = itemData; downloadQualityOptionsContainer.innerHTML = ''; qualitiesToDisplay.forEach((quality, index) => { const btn = document.createElement('button'); btn.className = 'quality-option-btn'; btn.textContent = quality.label; btn.onclick = () => { closeDownloadQualityPopup(true); openGeneratingLinkPopup(quality.url, itemData); }; downloadQualityOptionsContainer.appendChild(btn); if (index === 0) { setTimeout(() => btn.focus(), 0); } }); downloadQualityPopupOverlay.classList.add('visible'); }
function closeDownloadQualityPopup(calledInternally = false) { if (!downloadQualityPopupOverlay) return; downloadQualityPopupOverlay.classList.remove('visible'); if (!calledInternally && triggerElement) { triggerElement.focus(); triggerElement = null; } }

async function handleDownloadClick(itemData) {
    if (!itemData || itemData.isLiveTV) {
        openGeneratingLinkPopup(null, itemData); 
        return;
    }
    const availableDownloads = itemData.downloadOptions.filter(opt => opt.url);

    if (availableDownloads.length === 0) {
        openGeneratingLinkPopup(null, itemData);
    } else if (availableDownloads.length === 1) {
        openGeneratingLinkPopup(availableDownloads[0].url, itemData);
    } else {
        openGeneratingLinkPopup('multi', itemData);
    }
}

function openGeneratingLinkPopup(downloadAction, itemData) {
    if (!downloadGeneratingPopupOverlay || !downloadGeneratingTimerEl) return;
    triggerElement = document.activeElement;

    if (downloadCountdownIntervalId) clearInterval(downloadCountdownIntervalId);
    
    downloadGeneratingTimerEl.textContent = 'Loading Ad...';
    downloadGeneratingPopupOverlay.classList.add('visible');
    
    injectBannerAd(generatingAdContainer);
    
    let countdown = 10;
    downloadGeneratingTimerEl.textContent = `${countdown}s`;

    downloadCountdownIntervalId = setInterval(() => {
        countdown--;
        downloadGeneratingTimerEl.textContent = `${countdown}s`;
        if (countdown <= 0) {
            clearInterval(downloadCountdownIntervalId);
            closeGeneratingLinkPopup(true);
            
            if (downloadAction === 'multi') {
                openDownloadQualityPopup(itemData, itemData.downloadOptions.filter(opt => opt.url));
            } else if (downloadAction) {
                window.open(downloadAction, '_blank');
                showCustomToast('Download started in a new tab!', 'success', 5000);
            } else {
                openUnavailableLinkPopup();
            }
        }
    }, 1000);
}

function closeGeneratingLinkPopup(calledInternally = false) {
    if (!downloadGeneratingPopupOverlay) return;
    if (downloadCountdownIntervalId) {
        clearInterval(downloadCountdownIntervalId);
        downloadCountdownIntervalId = null;
    }
    downloadGeneratingPopupOverlay.classList.remove('visible');
    if (!calledInternally && triggerElement) {
        triggerElement.focus();
        triggerElement = null;
    }
}

function openUnavailableLinkPopup() {
    if (!downloadUnavailablePopupOverlay) return;
    triggerElement = document.activeElement;
    
    downloadUnavailablePopupOverlay.classList.add('visible');
    injectBannerAd(unavailableAdContainer);
    
    downloadUnavailableCloseBtn.disabled = true;
    unavailableCloseBtnText.style.display = 'none';
    unavailableCloseBtnTimer.style.display = 'block';

    let countdown = 10;
    unavailableCloseBtnTimer.textContent = `${countdown}s`;

    if (unavailableCloseBtnIntervalId) clearInterval(unavailableCloseBtnIntervalId);
    unavailableCloseBtnIntervalId = setInterval(() => {
        countdown--;
        unavailableCloseBtnTimer.textContent = `${countdown}s`;
        if (countdown <= 0) {
            clearInterval(unavailableCloseBtnIntervalId);
            downloadUnavailableCloseBtn.disabled = false;
            unavailableCloseBtnText.style.display = 'block';
            unavailableCloseBtnTimer.style.display = 'none';
            if(document.activeElement === document.body || document.activeElement === null) {
                downloadUnavailableCloseBtn.focus();
            }
        }
    }, 1000);
}

function closeUnavailableLinkPopup(calledInternally = false) {
    if (!downloadUnavailablePopupOverlay) return;
    if(unavailableCloseBtnIntervalId) {
        clearInterval(unavailableCloseBtnIntervalId);
        unavailableCloseBtnIntervalId = null;
    }
    downloadUnavailablePopupOverlay.classList.remove('visible');
    if (!calledInternally && triggerElement) {
        triggerElement.focus();
        triggerElement = null;
    }
}

function populateUpNextSection(currentItem) {
    upNextItemsEl.innerHTML = '';
    let upNextItems = [];

    if (currentItem.isLiveTV) {
        
        upNextItems = allContentData.filter(item => 
            item.isLiveTV && 
            item.id !== currentItem.id && 
            item.liveTVFolderTitle === currentItem.liveTVFolderTitle && 
            !item.isMaintenance
        );
    } else {
        
        const hasFolder = currentItem.folderTitle;
        if (!hasFolder) {
            upNextContainerEl.style.display = 'none';
            return;
        }

        upNextItems = allContentData.filter(item => {
            if (item.id === currentItem.id || item.isMaintenance || item.isLiveTV) return false;
            if (item.folderTitle !== currentItem.folderTitle) return false;
            return currentItem.subFolderTitle ? (item.subFolderTitle === currentItem.subFolderTitle) : !item.subFolderTitle;
        });
    }
    
    if (upNextItems.length === 0) {
        upNextContainerEl.style.display = 'none';
        return;
    }
    
    upNextItems = shuffleArray(upNextItems);
    
    upNextItems.forEach(item => {
        upNextItemsEl.appendChild(createListItemCard(item, {isFeaturedItem: false, isLiveTV: item.isLiveTV}));
    });
    
    upNextContainerEl.style.display = 'block';
}
function getNextVideoItem() {
    const nextCard = upNextItemsEl.querySelector('.list-item-card');
    if (!nextCard) return null;
    const nextItemId = nextCard.dataset.itemId;
    return allContentData.find(item => item.id === nextItemId);
}
function playNextVideo() {
    hideNextPlayNotification();
    const nextItem = getNextVideoItem();
    if (nextItem) {
        proceedToPlayOrQualitySelect(nextItem);
    } else {
        console.log("Autoplay: No next video found.");
        closeInlineVideoPlayer(false);
    }
}
function showNextPlayNotification() {
    const nextItem = getNextVideoItem();
    if (!nextItem || nextPlayNotificationShown) return;
    
    nextPlayNotificationShown = true;
    nextPlayingTitleEl.textContent = nextItem.title;
    nextPlayingOverlayEl.classList.add('visible');

    videoContainer.classList.add('controls-hidden');

    nextPlayTimeoutId = setTimeout(() => {
        if (isAutoplayEnabled) {
            playNextVideo();
        } else {
            hideNextPlayNotification();
        }
    }, 5000);
}
function hideNextPlayNotification() {
    clearTimeout(nextPlayTimeoutId);
    nextPlayTimeoutId = null;
    nextPlayingOverlayEl.classList.remove('visible');
}
window.addEventListener('resize', () => { setPlayerWrapperHeight(); });
function populateDrawerMenu() { if (!drawerNavListEl || !appConfig.categoryDetails) { console.warn("Drawer or category details not available for populating menu."); return; } drawerNavListEl.innerHTML = ''; navLinks = []; Object.entries(appConfig.categoryDetails).forEach(([key, details]) => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = "#"; a.classList.add('nav-link'); if (key === currentSection) a.classList.add('active'); a.dataset.section = key; a.dataset.iconUrl = details.icon; const img = document.createElement('img'); img.src = details.icon; img.alt = `${details.name} Icon`; const span = document.createElement('span'); span.className = 'nav-text-wrapper'; span.textContent = details.name; a.appendChild(img); a.appendChild(span); li.appendChild(a); drawerNavListEl.appendChild(li); navLinks.push(a); a.addEventListener('click', (e) => { e.preventDefault(); const newSection = a.dataset.section; if (currentSection !== newSection && inlinePlayerWrapper.classList.contains('active')) { closeInlineVideoPlayer(false); } closeAllPopups(); currentSection = newSection; setActiveNavLink(a); resetNavigation(); renderContent(); if (drawerMenuEl.classList.contains('open')) { toggleDrawer(); } }); }); }
function populateBottomNav() { 
    if (!bottomNavEl || !appConfig.categoryDetails) return; 
    bottomNavEl.innerHTML = ''; 
    bottomNavLinks = []; 
    const navOrder = ['all', 'isMovie', 'isSeries', 'isLiveTV']; 
    const categoryMap = { 
        all: { key: 'all', svg: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' }, 
        isMovie: { key: 'isMovie', svg: '<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>' }, 
        isSeries: { key: 'isSeries', svg: '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H8v-2h4V6h2v4h4v2z"/></svg>' }, 
        isLiveTV: { key: 'isLiveTV', svg: '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>'}
    }; 
    for (const cat of navOrder) { 
        const catDetails = Object.values(appConfig.categoryDetails).find(d => d.dataKey === cat); 
        if (catDetails) { 
            const btn = document.createElement('button'); 
            btn.className = 'bottom-nav-item'; 
            btn.dataset.section = Object.keys(appConfig.categoryDetails).find(k => appConfig.categoryDetails[k] === catDetails); 
            btn.innerHTML = `${categoryMap[cat].svg}<span>${catDetails.name}</span>`; 
            btn.addEventListener('click', () => { 
                const targetSection = drawerNavListEl.querySelector(`.nav-link[data-section="${btn.dataset.section}"]`); 
                if (targetSection) { targetSection.click(); } 
            }); 
            bottomNavEl.appendChild(btn); 
            bottomNavLinks.push(btn); 
        } 
    } 
}
function updateHeaderTitle() { const appTitleTextEl = document.querySelector('.app-title'); if (headerImageUrl) { appTitleTextEl.style.display = 'none'; appTitleLogoEl.style.display = 'none'; appTitleTextImageEl.src = headerImageUrl; appTitleTextImageEl.style.display = 'block'; } else { appTitleTextEl.style.display = 'flex'; appTitleLogoEl.style.display = 'inline-block'; appTitleTextImageEl.style.display = 'none'; appTitleTextImageEl.src = ''; } }
function initializeAppUI(){ 
    menuBtn.innerHTML="☰"; 
    const defaultLogoUrl = 'https://i.ibb.co/B2BZ4B2S/file-00000000c38461f885244c3d7088bd8e.png'; 
    if (loginScreenLogoEl) { loginScreenLogoEl.src = defaultLogoUrl; } 
    if (appTitleLogoEl) { appTitleLogoEl.src = defaultLogoUrl; } 
    updateHeaderTitle();
    renderUserProfileInDrawer();
    populateDrawerMenu(); 
    populateBottomNav(); 
    loadWatchHistory(); 
    loadUserVotes(); 
    loadUserViews();
    isAutoplayEnabled = localStorage.getItem(AUTOPLAY_KEY) === 'true';
    autoplayToggleEl.checked = isAutoplayEnabled;
    autoplayToggleEl.addEventListener('change', () => {
        isAutoplayEnabled = autoplayToggleEl.checked;
        localStorage.setItem(AUTOPLAY_KEY, isAutoplayEnabled);
    });
    cancelNextPlayBtn.addEventListener('click', hideNextPlayNotification);
    
    backBtn.addEventListener('click', handleBackPress);
    refreshSectionBtn.addEventListener('click', handleSectionRefresh);

    if (pipBtn) { pipBtn.classList.toggle('hidden', !document.pictureInPictureEnabled); } 
    if(infoPopupLikeBtn) infoPopupLikeBtn.addEventListener('click', () => { if(currentPopupItem && currentUser.id) window.handleVote(currentPopupItem.id, 'like'); });
    if(infoPopupDislikeBtn) infoPopupDislikeBtn.addEventListener('click', () => { if(currentPopupItem && currentUser.id) window.handleVote(currentPopupItem.id, 'dislike'); });

    const initialLink = drawerNavListEl.querySelector(`.nav-link[data-section="${currentSection}"]`) || drawerNavListEl.querySelector('.nav-link[data-section="all"]'); 
    if (initialLink) setActiveNavLink(initialLink);
    setPlayerWrapperHeight(); 
}
async function runNormalStartup() {
    const savedUserName = localStorage.getItem(USER_NAME_KEY);
    const savedUserId = localStorage.getItem(USER_ID_KEY);
    if (savedUserName && savedUserId) {
        currentUser.id = savedUserId;
        currentUser.name = savedUserName;
        if (db) {
            const userRef = doc(db, "users", savedUserId);
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    currentUser.name = userData.name || savedUserName;
                    currentUser.profilePictureUrl = userData.profilePictureUrl || DEFAULT_PROFILE_PIC_URL;
                }
            } catch (error) { console.error("Error fetching user profile on load:", error); }
        }
        userProfilesCache[savedUserId] = { ...currentUser };
        proceedToApp();
        const loadedFromCache = loadDataFromCache(); 
        initializeAppUI();
        if (loadedFromCache) { 
            renderContent();
            fetchDataFromSheet();
        } else { 
            await fetchDataFromSheet(); 
        }
    } else {
        loginButtonEl.disabled = true;
        loginOverlayEl.style.display = 'flex';
        appContainerEl.classList.remove('visible');
        document.body.classList.remove('user-logged-in');
        loadDataFromCache();
        initializeAppUI();
    }
}


function handleBackPress() {
    
    if (document.fullscreenElement) { if (document.exitFullscreen) { document.exitFullscreen(); } return; }
    if (document.querySelector('.profile-popup-overlay.visible')) { closeProfilePopup(); return; }
    if (document.querySelector('.comments-popup-overlay.visible')) { closeCommentsPopup(); return; }
    if (downloadGeneratingPopupOverlay.classList.contains('visible')) { closeGeneratingLinkPopup(); return; }
    if (downloadUnavailablePopupOverlay.classList.contains('visible') && !downloadUnavailableCloseBtn.disabled) { closeUnavailableLinkPopup(); return; }
    if (qualityPopupOverlay.classList.contains('visible')) { closeQualityPopup(); return; }
    if (downloadQualityPopupOverlay.classList.contains('visible')) { closeDownloadQualityPopup(); return; }
    if (infoPopupOverlay.classList.contains('visible')) { closeInfoPopup(); return; }

    
    if (drawerMenuEl.classList.contains('open')) {
        toggleDrawer();
        return;
    }

    
    if (inlinePlayerWrapper.classList.contains('active')) {
        closeInlineVideoPlayer(false);
        return;
    }

    
    if (navigationPath.length > 0) {
        navigateBack();
        return;
    }

    
    if (currentSection !== 'all') {
        const allLink = drawerNavListEl.querySelector('.nav-link[data-section="all"]');
        if (allLink) {
            allLink.click();
        }
        return;
    }
    
    
    if (backPressExitIntent) {
        
        navigator.app?.exitApp(); 
        return;
    }

    
    backPressExitIntent = true;
    showCustomToast("Press back again to exit Movies Hub", "info", 2000);

 
    if (backPressTimeoutId) clearTimeout(backPressTimeoutId);

    
    backPressTimeoutId = setTimeout(() => {
        backPressExitIntent = false;
    }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => { 
    loadUserVotes();
    loadUserViews();
    await fetchAppConfiguration();

    document.addEventListener('contextmenu', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        event.preventDefault();
    });

    
    history.pushState(null, '');

    window.addEventListener('popstate', (event) => {
        
        history.pushState(null, '');
        
        handleBackPress();
    });

    runNormalStartup();
});