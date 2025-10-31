console.log("admin.js loaded");

// DOM references
const loginSection = document.getElementById("login-section");
const uploadSection = document.getElementById("upload-section");
const loginBtn = document.getElementById("login-btn");
const loginMsg = document.getElementById("login-msg");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const uploadBtn = document.getElementById("upload-btn");
const uploadMsg = document.getElementById("upload-msg");
const adminGallery = document.getElementById("admin-gallery");
const userStatus = document.getElementById("user-status");
const galleryWrapper = document.getElementById("gallery-wrapper");

// supabase client (from supabase.js)
const client = window.supabaseClient;

// lockout check on page load
let failedAttempts = parseInt(localStorage.getItem("failedAttempts")) || 0;
let lockUntil = parseInt(localStorage.getItem("lockUntil")) || 0;
let isLocked = false;

if (Date.now() < lockUntil) {
  isLocked = true;
  lockLoginButton();
} else {
  clearLockout();
}

// auto login if session active
client.auth.getSession().then(({ data }) => {
  if (data.session) {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
    startLogoutTimer();
  }
});

// login handler with lockout
loginBtn.addEventListener("click", async () => {
  if (isLocked) {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    loginMsg.textContent = `Locked. Try again in ${remaining}s.`;
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginMsg.textContent = "Please enter both email and password.";
    setTimeout(() => {loginMsg.textContent = "";}, 3000);
    return;
  }

  loginMsg.textContent = "Logging in...";

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    failedAttempts++;
    localStorage.setItem("failedAttempts", failedAttempts);

    loginMsg.textContent = "Login failed: " + error.message;

    if (failedAttempts >= 3) {
      const lockDuration = 60 * 1000; // 1 minute
      lockUntil = Date.now() + lockDuration;
      localStorage.setItem("lockUntil", lockUntil);
      isLocked = true;
      lockLoginButton();
    }
  } else {
    failedAttempts = 0;
    clearLockout();

    showUploadSection(data.user.email);
    loadAdminGallery();
    startLogoutTimer();
  }
});

function lockLoginButton() {
  loginBtn.disabled = true;
  const interval = setInterval(() => {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(interval);
      clearLockout();
      return;
    }
    loginMsg.textContent = `Locked. Try again in ${remaining}s.`;
  }, 1000);
}

function clearLockout() {
  isLocked = false;
  failedAttempts = 0;
  localStorage.removeItem("failedAttempts");
  localStorage.removeItem("lockUntil");
  loginBtn.disabled = false;
  loginMsg.textContent = "";
}

// ui toggle after login
function showUploadSection(userEmail) {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  galleryWrapper.style.display = "block";
  userStatus.textContent = `Logged in as: ${userEmail}`;
}

// upload handler ---
uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("image").files[0];

  if (!file || !title) {
    uploadMsg.textContent = "Image and title required.";
    setTimeout(() => {uploadMsg.textContent = "";}, 3000);
    return;
  }

  try {
    const filePath = `portraits/${Date.now()}-${file.name}`;

    const { error: storageError } = await client.storage
      .from("gallery")
      .upload(filePath, file);
    if (storageError) throw storageError;

    const { data: urlData } = client.storage
      .from("gallery")
      .getPublicUrl(filePath);

    const { error: dbError } = await client
      .from("portraits")
      .insert([{ title, image_url: urlData.publicUrl }]);
    if (dbError) throw dbError;

    uploadMsg.textContent = "Upload successful!";
    setTimeout(() => {uploadMsg.textContent = "";}, 3000);
    document.getElementById("title").value = "";
    document.getElementById("image").value = "";
    fileNameText.textContent = "";
    clearBtn.style.display = "none";

    loadAdminGallery();
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Error: " + (err.message || err);
  }
});

// gallery loader
async function loadAdminGallery() {
  adminGallery.innerHTML = "Loading...";

  try {
    const { data, error } = await client
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    galleryWrapper.style.display = "block";
    adminGallery.innerHTML = "";

    if (data.length === 0) {
      adminGallery.innerHTML = "<p>No images found.</p>";
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "portrait-card";
      card.dataset.id = item.id;
      card.dataset.url = item.image_url;

      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title}">
        <h3>${item.title}</h3>
        <div class="card-actions">
          <button class="delete-btn">Delete</button>
        </div>
        <div class="confirm-box">
          <p>Are you sure you want to delete?</p>
          <button class="confirm-yes">Yes</button>
          <button class="confirm-no">No</button>
        </div>
      `;
      adminGallery.appendChild(card);
    });

    // Delete confirmation logic
    adminGallery.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".portrait-card");
        card.classList.add("show-confirm");
      });
    });

    adminGallery.querySelectorAll(".confirm-no").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".portrait-card").classList.remove("show-confirm");
      });
    });

    adminGallery.querySelectorAll(".confirm-yes").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const card = e.target.closest(".portrait-card");
        const id = card.dataset.id;
        const imageUrl = card.dataset.url;
        const fileName = imageUrl.split("/").pop();
        const filePath = `portraits/${fileName}`;

        try {
          await client.storage.from("gallery").remove([filePath]);
          await client.from("portraits").delete().eq("id", id);
          card.remove();

          const msg = document.createElement("p");
          msg.textContent = "🗑️ Image deleted.";
          msg.className = "info-msg";
          galleryWrapper.insertBefore(msg, adminGallery);
          setTimeout(() => msg.remove(), 3000);
        } catch (err) {
          console.error("Error deleting portrait:", err.message || err);
          alert("Failed to delete portrait. See console for details.");
        }
      });
    });
  } catch (err) {
    console.error(err);
    adminGallery.textContent = "Error loading gallery.";
  }
}

// logout handler ---
document.getElementById("logout-btn").addEventListener("click", async () => {
  await client.auth.signOut();
  clearLockout(); // reset lockout on logout
  loginSection.style.display = "block";
  uploadSection.style.display = "none";
  galleryWrapper.style.display = "none";

  // clear supabase token [ensures full logout]
  localStorage.removeItem("supabase.auth.token");
  loginMsg.textContent = "You have been logged out.";

  // clear form data
  emailInput.value = "";
  passwordInput.value = "";
  document.getElementById("title").value = "";
  document.getElementById("image").value = "";
  fileNameText.textContent = "";
  clearBtn.style.display = "none";
  uploadMsg.textContent = "";

  setTimeout(() => {loginMsg.textContent = "";}, 3000);
});

// file input handlers
const imageInput = document.getElementById("image");
const clearBtn = document.getElementById("clear-file");
const fileNameText = document.getElementById("file-name");

imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    fileNameText.textContent = `Selected: ${imageInput.files[0].name}`;
    clearBtn.style.display = "inline-block";
  }
});

clearBtn.addEventListener("click", () => {
  imageInput.value = "";
  fileNameText.textContent = "";
  clearBtn.style.display = "none";
});

// helper: remove EXIF metadata from images
async function stripImageMetadata(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) reject("Failed to create clean image blob");
            else resolve(blob);
          },
          "image/jpeg", // re-encode as JPEG (strips EXIF & title)
          0.9 // image quality = 90%
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

imageInput.addEventListener("change", async () => {
  if (imageInput.files.length === 0) return;

  const originalFile = imageInput.files[0];
  uploadMsg.textContent = "Cleaning image metadata...";

  try {
    const cleanBlob = await stripImageMetadata(originalFile);
    // remove original file name 
    const anonymousName = `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const cleanFile = new File([cleanBlob], anonymousName, {
      type: "image/jpeg",
    });

    // replace the selected file with the cleaned one
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(cleanFile);
    imageInput.files = dataTransfer.files;

    // update UI 
    fileNameText.textContent = `Image title: ${cleanFile.name}`;
    clearBtn.style.display = "inline-block";
    uploadMsg.textContent = "Image cleaned and ready to upload.";
    setTimeout(() => { uploadMsg.textContent = ""; }, 3000);
  } catch (err) {
    console.error("Metadata cleanup failed:", err);
    uploadMsg.textContent = "Failed to clean image metadata.";
    setTimeout(() => { uploadMsg.textContent = ""; }, 3000);
  }
});

clearBtn.addEventListener("click", () => {
  imageInput.value = "";
  fileNameText.textContent = "";
  clearBtn.style.display = "none";
});


// uto logout (inactivity)
const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes
let logoutTimer;
let warningTimer;

const logoutModal = document.createElement("div");
logoutModal.innerHTML = `
  <div class="logout-modal">
    <div class="logout-box">
      <p>Your session is about to expire due to inactivity.</p>
      <div class="logout-actions">
        <button id="stay-logged-in" class="btn primary">Stay Logged In</button>
        <button id="logout-now" class="btn outline">Logout Now</button>
      </div>
    </div>
  </div>
`;
document.body.appendChild(logoutModal);
logoutModal.style.display = "none";

function showLogoutWarning() {
  logoutModal.style.display = "flex";
}
function hideLogoutWarning() {
  logoutModal.style.display = "none";
}
function startLogoutTimer() {
  clearTimeout(logoutTimer);
  clearTimeout(warningTimer);

  warningTimer = setTimeout(() => showLogoutWarning(), AUTO_LOGOUT_TIME - 60 * 1000);
  logoutTimer = setTimeout(async () => {
    await client.auth.signOut();
    window.location.reload();
  }, AUTO_LOGOUT_TIME);
}
function resetLogoutTimer() {
  hideLogoutWarning();
  startLogoutTimer();
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt =>
  document.addEventListener(evt, resetLogoutTimer)
);

document.addEventListener("click", (e) => {
  if (e.target.id === "stay-logged-in") resetLogoutTimer();
  if (e.target.id === "logout-now") client.auth.signOut().then(() => window.location.reload());
});
