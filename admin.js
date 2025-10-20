supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    // not logged in, redirect
    window.location.href = "login.html"; // or show login inside same page
  } else {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
  }
});

console.log("admin.js loaded");

// DOM
const loginSection = document.getElementById('login-section');
const uploadSection = document.getElementById('upload-section');
const loginBtn = document.getElementById('login-btn');
const loginMsg = document.getElementById('login-msg');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const uploadBtn = document.getElementById('upload-btn');
const uploadMsg = document.getElementById('upload-msg');
const adminGallery = document.getElementById('admin-gallery');
const userStatus = document.getElementById('user-status');

// check session
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    showUploadSection(data.session.user.email);
    loadAdminGallery();
  }
});

// login
loginBtn.addEventListener('click', async () => {
  loginMsg.textContent = "Logging in...";
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
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

// upload image
uploadBtn.addEventListener('click', async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById('title').value;
  const file = document.getElementById('image').files[0];
  if (!file || !title) return uploadMsg.textContent = "❗ Title & image required.";

  const filePath = `portraits/${Date.now()}-${file.name}`;
  const { error: storageError } = await supabase.storage.from('gallery').upload(filePath, file);
  if (storageError) return uploadMsg.textContent = storageError.message;

  const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);

  const { error: dbError } = await supabase.from('portraits')
    .insert([{ title, image_url: urlData.publicUrl }]);
  if (dbError) return uploadMsg.textContent = dbError.message;

  uploadMsg.textContent = "Upload successful!";
  loadAdminGallery(); // refresh gallery
});

// load gallery
async function loadAdminGallery() {
  const galleryWrapper = document.getElementById('gallery-wrapper');
  adminGallery.innerHTML = "Loading...";

  const { data, error } = await supabase
    .from('portraits')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    adminGallery.textContent = "Error loading gallery.";
    return;
  }

  // If there ARE images, show the gallery
  if (data.length > 0) {
    galleryWrapper.style.display = "block";
  } else {
    galleryWrapper.style.display = "none"; // hide if empty
  }

  adminGallery.innerHTML = "";

  data.forEach(item => {
    adminGallery.innerHTML += `
      <div class="portrait-card">
        <img src="${item.image_url}" alt="${item.title}">
        <h3>${item.title}</h3>
        <button onclick="deletePortrait(${item.id}, '${item.image_url}')">Delete</button>
      </div>
    `;
  });
}

// delete portrait
window.deletePortrait = async function(id, imageUrl) {
  if (!confirm("Delete portrait?")) return;

  // remove from storage
  const fileName = imageUrl.split("/").pop();
  await supabase.storage.from('gallery').remove([`portraits/${fileName}`]);

  // remove from DB
  await supabase.from('portraits').delete().eq('id', id);

  loadAdminGallery();
};

// logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});
