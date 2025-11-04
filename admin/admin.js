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
    const { user } = data.session;

    // use stored login time 
    const sessionStart = parseInt(localStorage.getItem("sessionStart")) || 0;
    const now = Date.now();
    const MAX_SESSION_AGE = 30 * 60 * 1000; // 30 minutes

    if (sessionStart && now - sessionStart > MAX_SESSION_AGE) {
      console.log("Session expired - logging out...");
      client.auth.signOut().then(() => console.log("Signed out"));
      localStorage.removeItem("sessionStart");
      localStorage.removeItem("supabase.auth.token");
    } else {
      //console.log("Session active - auto-logged in.");
      // set timestamp if there is none
      if (!sessionStart) localStorage.setItem("sessionStart", Date.now());
      showUploadSection(user.email);
      loadAdminGallery();
      startLogoutTimer();
    }
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

  if (!email && !password) {
    loginMsg.textContent = "Please enter both email and password.";
  } else if (!email) {
    loginMsg.textContent = "Please enter your email.";
  } else if (!password) {
    loginMsg.textContent = "Please enter your password.";
  }

  if (!email || !password) {
    setTimeout(() => (loginMsg.textContent = ""), 3000);
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

    // use actual session start
    localStorage.setItem("sessionStart", Date.now());

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
}

// upload handler
uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("image").files[0];

  if (!file || !title) {
    uploadMsg.textContent = "Image and title required.";
    setTimeout(() => (uploadMsg.textContent = ""), 3000);
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

    uploadMsg.textContent = "Image upload successful!";
    setTimeout(() => (uploadMsg.textContent = ""), 3000);
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

    adminGallery.innerHTML = "";
    galleryWrapper.style.display = "block";

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
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
        <div class="confirm-box">
          <p>Are you sure you want to delete?</p>
          <button class="confirm-yes">Yes</button>
          <button class="confirm-no">No</button>
        </div>
      `;
      adminGallery.appendChild(card);
      attachGalleryListeners(card);
    });
  } catch (err) {
    console.error(err);
    adminGallery.textContent = "Error loading gallery.";
  }
}

// logout handler
document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await client.auth.signOut({ scope: "global" });
    localStorage.clear();
    sessionStorage.clear();

    loginSection.style.display = "block";
    uploadSection.style.display = "none";
    galleryWrapper.style.display = "none";

    loginMsg.textContent = "You have been logged out.";
    setTimeout(() => (loginMsg.textContent = ""), 3000);

    emailInput.value = "";
    passwordInput.value = "";
    document.getElementById("title").value = "";
    document.getElementById("image").value = "";
    fileNameText.textContent = "";
    clearBtn.style.display = "none";
    uploadMsg.textContent = "";

    setTimeout(() => window.location.reload(), 5000);
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
});

// file input handlers
const imageInput = document.getElementById("image");
const clearBtn = document.getElementById("clear-file");
const fileNameText = document.getElementById("file-name");

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) {
    fileNameText.textContent = "";
    clearBtn.style.display = "none";
    return;
  }

  fileNameText.textContent = "Removing image metadata...";
  clearBtn.style.display = "none";

  try {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const cleanBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );

    const anonymousName = `image-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.jpg`;
    const cleanFile = new File([cleanBlob], anonymousName, {
      type: "image/jpeg",
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(cleanFile);
    imageInput.files = dataTransfer.files;

    const previewContainer = document.createElement("div");
    previewContainer.className = "preview-container";
    previewContainer.style.display = "flex";
    previewContainer.style.alignItems = "center";
    previewContainer.style.gap = "10px";
    previewContainer.style.marginTop = "10px";

    const preview = document.createElement("img");
    preview.src = URL.createObjectURL(cleanBlob);
    preview.alt = "Preview";
    preview.style.width = "100px";
    preview.style.height = "auto";
    preview.style.borderRadius = "8px";

    clearBtn.style.display = "inline-block";
    clearBtn.style.marginTop = "0";

    const existingPreview = document.getElementById("preview-thumb");
    if (existingPreview) existingPreview.remove();
    preview.id = "preview-thumb";

    previewContainer.appendChild(preview);
    previewContainer.appendChild(clearBtn);
    fileNameText.textContent = "Selected image:";
    fileNameText.appendChild(previewContainer);
  } catch (err) {
    console.error("Error removing metadata:", err);
    fileNameText.textContent = "Failed to process image.";
  }
});

clearBtn.addEventListener("click", () => {
  imageInput.value = "";
  fileNameText.textContent = "";
  clearBtn.style.display = "none";
});

// auto logout after inactivity
const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
let logoutTimer, warningTimer;

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

// handles edit/cancel/delete 
function attachGalleryListeners(card) {
  if (!card) return;

  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");
  const confirmYes = card.querySelector(".confirm-yes");
  const confirmNo = card.querySelector(".confirm-no");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const titleEl = card.querySelector("h3");
      const actions = card.querySelector(".card-actions");
      const currentTitle = titleEl.textContent.trim();

      const input = document.createElement("input");
      input.type = "text";
      input.value = currentTitle;
      input.className = "edit-input";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "save-btn";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "cancel-btn";

      titleEl.replaceWith(input);
      actions.innerHTML = "";
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      cancelBtn.addEventListener("click", () => {
        input.replaceWith(titleEl);
        actions.innerHTML = `
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        `;
        attachGalleryListeners(card);
      });

      saveBtn.addEventListener("click", async () => {
        const newTitle = input.value.trim();
        const id = card.dataset.id;

        if (!newTitle) {
          alert("Title cannot be empty.");
          return;
        }

        try {
          const { data, error } = await client
            .from("portraits")
            .update({ title: newTitle })
            .eq("id", id)
            .select();

          if (error) throw error;
          if (!data || data.length === 0)
            console.warn("No rows updated - check Supabase ID column name.");

          titleEl.textContent = newTitle;
          input.replaceWith(titleEl);

          actions.innerHTML = `
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          `;
          attachGalleryListeners(card);
        } catch (err) {
          console.error("Error updating title:", err.message || err);
          alert("Failed to update title.");
        }
      });
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      card.classList.add("show-confirm");
    });
  }

  if (confirmNo) {
    confirmNo.addEventListener("click", () => {
      card.classList.remove("show-confirm");
    });
  }

  if (confirmYes) {
    confirmYes.addEventListener("click", async () => {
      const id = card.dataset.id;
      const imageUrl = card.dataset.url;
      const fileName = imageUrl.split("/").pop();
      const filePath = `portraits/${fileName}`;

      try {
        await client.storage.from("gallery").remove([filePath]);
        await client.from("portraits").delete().eq("id", id);
        card.remove();
      } catch (err) {
        console.error("Error deleting portrait:", err.message || err);
        alert("Failed to delete portrait. See console for details.");
      }
    });
  }
}
