// redirect if not signed in
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    console.log("Not logged in – staying on login page");
  } else {
    console.log("✅ Already logged in");
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
  }
});

console.log("admin.js loaded");

// DOM elements
const loginBtn = document.getElementById('login-btn');
const loginMsg = document.getElementById('login-msg');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginSection = document.getElementById('login-section');
const uploadSection = document.getElementById('upload-section');
const uploadBtn = document.getElementById('upload-btn');
const uploadMsg = document.getElementById('upload-msg');

// login
loginBtn.addEventListener('click', async () => {
  loginMsg.textContent = "Logging in...";
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value
    });

    if (error) {
      loginMsg.textContent = "Login failed: " + error.message;
    } else {
      loginMsg.textContent = "Logged in!";
      loginSection.style.display = "none";
      uploadSection.style.display = "block";
    }
  } catch (err) {
    loginMsg.textContent = "Unexpected error — check console";
    console.error(err);
  }
});

// upload
uploadBtn.addEventListener('click', async () => {
  uploadMsg.textContent = "Uploading...";

  const title = document.getElementById('title').value;
  const file = document.getElementById('image').files[0];

  if (!file || !title) {
    uploadMsg.textContent = "❗ Please enter a title and choose an image.";
    return;
  }

  try {
    // upload file to Supabase Storage
    const filePath = `portraits/${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await window.supabase
      .storage.from('gallery')
      .upload(filePath, file);

    if (storageError) {
      uploadMsg.textContent = "Upload failed: " + storageError.message;
      return;
    }

    // load gallery in admin
    async function loadAdminGallery() {
      const gallery = document.getElementById('admin-gallery');
      gallery.innerHTML = "Loading...";

      const { data, error } = await supabase
        .from('portraits')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        gallery.innerHTML = "Failed to load gallery.";
        return;
      }
      // clear
      gallery.innerHTML = ""; 

      data.forEach(item => {
        const div = document.createElement('div');
        div.className = "portrait-card";
        div.innerHTML = `
          <img src="${item.image_url}" alt="${item.title}">
          <h3>${item.title}</h3>
          <button onclick="deletePortrait(${item.id}, '${item.image_url}')">Delete</button>
        `;
        gallery.appendChild(div);
      });
    }
    // all gallery after login
    loadAdminGallery();

    // delete portrait
    async function deletePortrait(id, imageUrl) {
      if (!confirm("Delete this portrait?")) return;

      // extract filename from URL
      const filename = imageUrl.split('/').pop();

      // delete from storage
      await supabase.storage.from('gallery').remove([filename]);

      // delete from DB
      await supabase.from('portraits').delete().eq('id', id);

      // refresh gallery
      loadAdminGallery();
    }

    // get public URL
    const { data: urlData } = window.supabase
      .storage.from('gallery')
      .getPublicUrl(filePath);

    // insert into database
    const { error: dbError } = await window.supabase
      .from('portraits')
      .insert([{ title: title, image_url: urlData.publicUrl }]);

    if (dbError) {
      uploadMsg.textContent = "Database error: " + dbError.message;
    } else {
      uploadMsg.textContent = "Upload successful!";
    }
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "Unexpected error — check console";
  }
});

// logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = "admin.html"; // refresh back to login
});

