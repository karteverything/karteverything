console.log("admin.js loaded");

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

const client = window.supabaseClient;

client.auth.getSession().then(({ data }) => {
  if (data.session) {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
  }
});

loginBtn.addEventListener("click", async () => {
  loginMsg.textContent = "Logging in...";
  const { data, error } = await client.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) loginMsg.textContent = "Login failed: " + error.message;
  else {
    showUploadSection(data.user.email);
    loadAdminGallery();
  }
});

function showUploadSection(userEmail) {
  loginSection.style.display = "none";
  uploadSection.style.display = "block";
  galleryWrapper.style.display = "block";
  userStatus.textContent = `Logged in as: ${userEmail}`;
}

uploadBtn.addEventListener("click", async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById("title").value.trim();
  const file = document.getElementById("image").files[0];
  if (!file || !title) {
    uploadMsg.textContent = "Image and title required.";
    return;
  }

  try {
    const filePath = `portraits/${Date.now()}-${file.name}`;
    const { error: storageError } = await client.storage.from("gallery").upload(filePath, file);
    if (storageError) throw storageError;

    const { data: urlData } = client.storage.from("gallery").getPublicUrl(filePath);

    const { error: dbError } = await client
      .from("portraits")
      .insert([{ title, image_url: urlData.publicUrl }]);
    if (dbError) throw dbError;

    uploadMsg.textContent = "Image upload successful!";
    document.getElementById("title").value = "";
    document.getElementById("image").value = "";
    loadAdminGallery();
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Error: " + (err.message || err);
  }
});

async function loadAdminGallery() {
  adminGallery.innerHTML = "Loading...";
  galleryWrapper.style.display = "block";

  try {
    const { data, error } = await client
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;

    adminGallery.innerHTML = "";

    if (!data || data.length === 0) {
      adminGallery.innerHTML = `<p class="muted">No portraits uploaded yet.</p>`;
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

    adminGallery.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        e.target.closest(".portrait-card").classList.add("show-confirm")
      );
    });
    adminGallery.querySelectorAll(".confirm-no").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        e.target.closest(".portrait-card").classList.remove("show-confirm")
      );
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
          if (adminGallery.children.length === 0)
            adminGallery.innerHTML = `<p class="muted">No portraits uploaded yet.</p>`;
        } catch (err) {
          console.error(err);
          alert("Error deleting portrait.");
        }
      });
    });
  } catch (err) {
    console.error(err);
    adminGallery.textContent = "Error loading gallery.";
  }
}

document.getElementById("logout-btn").addEventListener("click", async () => {
  await client.auth.signOut();
  window.location.reload();
});

const imageInput = document.getElementById("image");
const fileNameText = document.getElementById("file-name");
const clearBtn = document.getElementById("clear-file");

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
