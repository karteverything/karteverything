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

    const sessionStart = parseInt(localStorage.getItem("sessionStart")) || 0;
    const now = Date.now();
    const MAX_SESSION_AGE = 30 * 60 * 1000;

    if (sessionStart && now - sessionStart > MAX_SESSION_AGE) {
      client.auth.signOut();
      localStorage.removeItem("sessionStart");
      localStorage.removeItem("supabase.auth.token");
    } else {
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

  if (!email || !password) {
    loginMsg.textContent = "Please enter both email and password.";
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
      lockUntil = Date.now() + 60 * 1000;
      localStorage.setItem("lockUntil", lockUntil);
      isLocked = true;
      lockLoginButton();
    }
  } else {
    clearLockout();
    localStorage.setItem("sessionStart", Date.now());
    showUploadSection(data.user.email);
    loadAdminGallery();
    startLogoutTimer();
  }
});

// logout handler
async function logoutUser() {
  await client.auth.signOut();  // logs out from supabase
  localStorage.clear();         // clears session data
  sessionStorage.clear();

  // reset ui
  loginSection.style.display = "block";
  uploadSection.style.display = "none";
  galleryWrapper.style.display = "none";

  // clear input values
  emailInput.value = "";
  passwordInput.value = "";
  document.getElementById("title").value = "";
  clearPreview(); 
}

document.getElementById("logout-btn").addEventListener("click", () => {
  logoutUser();
});

function lockLoginButton() {
  loginBtn.disabled = true;
  const interval = setInterval(() => {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(interval);
      clearLockout();
    } else {
      loginMsg.textContent = `Locked. Try again in ${remaining}s.`;
    }
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
function showUploadSection() {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  galleryWrapper.style.display = "block";
}

// file input handlers
const imageInput = document.getElementById("image");
const clearBtn = document.getElementById("clear-file");
const fileNameText = document.getElementById("file-name");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) {
    clearPreview();
    return;
  }

  // clear previous preview (prevents stacking)
  fileNameText.innerHTML = "";

  // wrapper to center everything
  const previewWrapper = document.createElement("div");
  previewWrapper.style.display = "flex";
  previewWrapper.style.flexDirection = "column";
  previewWrapper.style.alignItems = "center";
  previewWrapper.style.gap = "8px";

  // image preview 
  const previewImg = document.createElement("img");
  previewImg.src = URL.createObjectURL(file);
  previewImg.alt = "Image preview";
  previewImg.style.maxWidth = "160px";
  previewImg.style.borderRadius = "10px";
  previewImg.style.display = "block";

  // prevent memory leaks
  previewImg.onload = () => URL.revokeObjectURL(previewImg.src);

  // filename below image
  const nameEl = document.createElement("div");
  nameEl.textContent = file.name;
  nameEl.style.fontSize = "0.9rem";
  nameEl.style.opacity = "0.8";
  nameEl.style.textAlign = "center";

  previewWrapper.appendChild(previewImg);
  previewWrapper.appendChild(nameEl);
  fileNameText.appendChild(previewWrapper);

  // show cancel
  clearBtn.style.display = "inline-block"; 
});

// cancel button
clearBtn.addEventListener("click", () => {
  clearPreview();
});

// reusable clear function
function clearPreview() {
  imageInput.value = "";
  fileNameText.innerHTML = "";
  clearBtn.style.display = "none";
}

// reusable metadata-stripper 
async function stripImageMetadata(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );

  return new File([blob], `image-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

// upload handler
uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const originalFile = imageInput.files[0];

  if (!originalFile || !title) {
    uploadMsg.textContent = "Image and title required.";
    setTimeout(() => (uploadMsg.textContent = ""), 3000);
    return;
  }

  try {
    const cleanFile = await stripImageMetadata(originalFile);
    const filePath = `portraits/${Date.now()}-${cleanFile.name}`;

    const { error: storageError } = await client.storage
      .from("gallery")
      .upload(filePath, cleanFile);
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

    imageInput.value = "";
    fileNameText.textContent = "";
    clearBtn.style.display = "none";
    document.getElementById("title").value = "";

    loadAdminGallery();
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Upload failed.";
  }
});

// gallery loader
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

async function loadAdminGallery() {
  adminGallery.innerHTML = "Loading...";

  try {
    const { data, error } = await client
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    adminGallery.innerHTML = "";

    if (!data.length) {
      adminGallery.innerHTML = "<p>No images found.</p>";
      return;
    }

    // shuffle images
    const shuffled = shuffle(data);

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "portrait-card";
      card.dataset.id = item.id;
      card.dataset.url = item.image_url;

      card.innerHTML = `
        <label class="select-box">
          <input type="checkbox" class="select-checkbox">
        </label>

        <img src="${item.image_url}" alt="${item.title}">
        <h3>${item.title}</h3>
        
        <div class="card-actions">
          <button class="edit-btn">Rename Image</button>
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

// auto logout after inactivity
const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
let logoutTimer, warningTimer;

function startLogoutTimer() {
  clearTimeout(logoutTimer);
  clearTimeout(warningTimer);

  warningTimer = setTimeout(() => {
    alert("Session expiring due to inactivity.");
  }, AUTO_LOGOUT_TIME - 60 * 1000);

  logoutTimer = setTimeout(async () => {
    await client.auth.signOut();
    window.location.reload();
  }, AUTO_LOGOUT_TIME);
}

function resetLogoutTimer() {
  startLogoutTimer();
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt =>
  document.addEventListener(evt, resetLogoutTimer)
);

// handles edit / cancel / delete
function attachGalleryListeners(card) {
  if (!card) return;

  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");
  const confirmYes = card.querySelector(".confirm-yes");
  const confirmNo = card.querySelector(".confirm-no");

  // ===== edit / save / cancel =====
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const titleEl = card.querySelector("h3");
      const actions = card.querySelector(".card-actions");
      const originalTitle = titleEl.textContent.trim();

      const originalActionsHTML = actions.innerHTML;

      const input = document.createElement("input");
      input.type = "text";
      input.value = originalTitle;
      input.className = "edit-input";
      // full card width
      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.fontSize = "inherit";
      input.style.fontFamily = "inherit";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "save-btn";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "cancel-btn";

      // swap title for input
      titleEl.replaceWith(input);

      // replace buttons
      actions.innerHTML = "";
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      // ---- cancel ----
      cancelBtn.addEventListener("click", () => {
        input.replaceWith(titleEl);
        actions.innerHTML = originalActionsHTML;
        attachGalleryListeners(card);
      });

      // ---- save ----
      saveBtn.addEventListener("click", async () => {
        const newTitle = input.value.trim();
        if (!newTitle) {
          alert("Title cannot be empty.");
          return;
        }

        try {
          await client
            .from("portraits")
            .update({ title: newTitle })
            .eq("id", card.dataset.id);

          titleEl.textContent = newTitle;
          input.replaceWith(titleEl);
          actions.innerHTML = originalActionsHTML;
          attachGalleryListeners(card);
        } catch (err) {
          console.error("Error updating title:", err);
          alert("Failed to update title.");
        }
      });
    });
  }

  // ===== delete =====
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
        console.error("Error deleting portrait:", err);
        alert("Failed to delete portrait.");
      }
    });
  }
}

// delete image button
const deleteSelectedBtn = document.getElementById("delete-selected");

document.addEventListener("change", () => {
  const checked = document.querySelectorAll(".select-checkbox:checked");
  deleteSelectedBtn.disabled = checked.length === 0;
});

// safely delete images
deleteSelectedBtn.addEventListener("click", async () => {
  const checkedCards = document.querySelectorAll(".select-checkbox:checked");

  if (!checkedCards.length) return;

  if (!confirm(`Delete ${checkedCards.length} image(s)?`)) return;

  for (const checkbox of checkedCards) {
    const card = checkbox.closest(".portrait-card");
    const id = card.dataset.id;
    const imageUrl = card.dataset.url;
    const fileName = imageUrl.split("/").pop();
    const filePath = `portraits/${fileName}`;

    await client.storage.from("gallery").remove([filePath]);
    await client.from("portraits").delete().eq("id", id);

    card.remove();
  }

  deleteSelectedBtn.disabled = true;
});


