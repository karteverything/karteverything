console.log("admin.js loaded");

// dom element references
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

// global supabase client (set in supabase.js)
const client = window.supabaseClient;

// session check — auto-login if active
client.auth.getSession().then(({ data }) => {
  if (data.session) {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
  }
});

// login handler
loginBtn.addEventListener("click", async () => {
  loginMsg.textContent = "Logging in...";

  const { data, error } = await client.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    loginMsg.textContent = "Login failed: " + error.message;
  } else {
    showUploadSection(data.user.email);
    loadAdminGallery();
  }
});

// toggle ui after login
function showUploadSection(userEmail) {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  galleryWrapper.style.display = "block";
  userStatus.textContent = `Logged in as: ${userEmail}`;
}

// image upload handler
uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("image").files[0];

  if (!file || !title) {
    uploadMsg.textContent = "❗ Image and title required.";
    return;
  }

  try {
    const filePath = `portraits/${Date.now()}-${file.name}`;

    // upload to supabase Storage
    const { error: storageError } = await client.storage
      .from("gallery")
      .upload(filePath, file);
    if (storageError) throw storageError;

    // get public url
    const { data: urlData } = client.storage
      .from("gallery")
      .getPublicUrl(filePath);

    // save metadata to dabase
    const { error: dbError } = await client
      .from("portraits")
      .insert([{ title, image_url: urlData.publicUrl }]);
    if (dbError) throw dbError;

    // success
    uploadMsg.textContent = "✅ Upload successful!";
    document.getElementById("title").value = "";
    document.getElementById("image").value = "";

    // refresh gallery
    loadAdminGallery(); 
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Error: " + (err.message || err);
  }
});

// load admin gallery
async function loadAdminGallery() {
  adminGallery.innerHTML = "Loading...";

  try {
    const { data, error } = await client
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    // always show gallery wrapper, even if empty
    galleryWrapper.style.display = "block";
    adminGallery.innerHTML = "";

    // if no images found, display message
    if (data.length === 0) {
      adminGallery.innerHTML = "<p>No images found.</p>";
      return;
    }

    // render each image
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

    // delete button login
    adminGallery.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".portrait-card");
        card.classList.add("show-confirm");
      });
    });

    // cancel delete
    adminGallery.querySelectorAll(".confirm-no").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".portrait-card");
        card.classList.remove("show-confirm");
      });
    });

    // confirm delete
    adminGallery.querySelectorAll(".confirm-yes").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const card = e.target.closest(".portrait-card");
        const id = card.dataset.id;
        const imageUrl = card.dataset.url;
        const fileName = imageUrl.split("/").pop();
        const filePath = `portraits/${fileName}`;

        try {
          // delete from storage
          await client.storage.from("gallery").remove([filePath]);
          // delete from dabase
          await client.from("portraits").delete().eq("id", id);

          // remove card from ui
          card.remove();

          // success message
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

// logout handler
document.getElementById("logout-btn").addEventListener("click", async () => {
  await client.auth.signOut();
  window.location.reload();
});

// file input handlers
const imageInput = document.getElementById("image");
const clearBtn = document.getElementById("clear-file");
const fileNameText = document.getElementById("file-name");

// show selected filename
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    const fileName = imageInput.files[0].name;
    fileNameText.textContent = `Selected: ${fileName}`;
    clearBtn.style.display = "inline-block";
  }
});

// clear selected file
clearBtn.addEventListener("click", () => {
  imageInput.value = "";
  fileNameText.textContent = "";
  clearBtn.style.display = "none";
});

// auto logout
const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes
let logoutTimer;
let warningTimer;

// create logout popup
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

  // show warning 1 minute before logout
  warningTimer = setTimeout(() => {
    showLogoutWarning();
  }, AUTO_LOGOUT_TIME - 60 * 1000);

  // Auto logout after set time
  logoutTimer = setTimeout(async () => {
    await client.auth.signOut();
    window.location.reload();
  }, AUTO_LOGOUT_TIME);
}

function resetLogoutTimer() {
  hideLogoutWarning();
  startLogoutTimer();
}

// listeners to reset timer on activity
["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(evt =>
  document.addEventListener(evt, resetLogoutTimer)
);

// modal button events
document.getElementById("stay-logged-in").addEventListener("click", resetLogoutTimer);
document.getElementById("logout-now").addEventListener("click", async () => {
  await client.auth.signOut();
  window.location.reload();
});

// start timer when logged in
client.auth.getSession().then(({ data }) => {
  if (data.session) {
    startLogoutTimer();
  }
});

// limit login attempts
let failedAttempts = 0;
let isLocked = false;

loginBtn.addEventListener("click", async () => {
  if (isLocked) {
    loginMsg.textContent = "Too many failed attempts. Try again later.";
    return;
  }

  loginMsg.textContent = "Logging in...";

  const { data, error } = await client.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value.trim(),
  });

  if (error) {
    failedAttempts++;
    loginMsg.textContent = "Login failed: " + error.message;

    // lockout after 5 failed attempts for 1 minute
    if (failedAttempts >= 3) {
      isLocked = true;
      loginMsg.textContent = "Too many failed attempts. Locked for 1 minute.";
      setTimeout(() => {
        failedAttempts = 0;
        isLocked = false;
        loginMsg.textContent = "";
      }, 60 * 1000);
    }
  } else {
    failedAttempts = 0;
    showUploadSection(data.user.email);
    loadAdminGallery();
  }
});


