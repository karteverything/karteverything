console.log("✅ admin.js loaded");

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

// use the correct client
const client = window.supabaseClient;

// check session
client.auth.getSession().then(({ data }) => {
  if (data.session) {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
  }
});

// login
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

function showUploadSection(userEmail) {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  userStatus.textContent = `Logged in as: ${userEmail}`;
}

// upload
uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("image").files[0];

  if (!file || !title) {
    uploadMsg.textContent = "Title & image required.";
    return;
  }

  try {
    const filePath = `portraits/${Date.now()}-${file.name}`;

    // upload to storage
    const { error: storageError } = await client.storage
      .from("gallery")
      .upload(filePath, file);
    if (storageError) throw storageError;

    // get public URL
    const { data: urlData } = client.storage.from("gallery").getPublicUrl(filePath);

    // save to DB
    const { error: dbError } = await client
      .from("portraits")
      .insert([{ title, image_url: urlData.publicUrl }]);
    if (dbError) throw dbError;

    uploadMsg.textContent = "Upload successful!";
    document.getElementById("title").value = "";
    document.getElementById("image").value = "";

    loadAdminGallery();
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Error: " + (err.message || err);
  }
});

// load gallery
async function loadAdminGallery() {
  const galleryWrapper = document.getElementById("gallery-wrapper");
  adminGallery.innerHTML = "Loading...";

  try {
    const { data, error } = await client
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;

    if (data.length > 0) {
      galleryWrapper.style.display = "block";
    } else {
      galleryWrapper.style.display = "none";
      return;
    }

    adminGallery.innerHTML = "";

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

    // delete button logic
    adminGallery.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.target.closest(".portrait-card").classList.add("show-confirm");
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
          msg.textContent = "🗑️ Image deleted";
          msg.className = "info-msg";
          galleryWrapper.insertBefore(msg, adminGallery);
          setTimeout(() => msg.remove(), 3000);

          if (adminGallery.children.length === 0) {
            galleryWrapper.style.display = "none";
          }
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

// logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await client.auth.signOut();
  window.location.reload();
});
