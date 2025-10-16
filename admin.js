// LOGIN
const loginBtn = document.getElementById('login-btn');
const loginMsg = document.getElementById('login-msg');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginSection = document.getElementById('login-section');
const uploadSection = document.getElementById('upload-section');

loginBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    loginMsg.textContent = "Login failed: " + error.message;
  } else {
    loginMsg.textContent = "Logged in!";
    loginSection.style.display = 'none';
    uploadSection.style.display = 'block';
  }
});

// UPLOAD
const uploadBtn = document.getElementById('upload-btn');
const uploadMsg = document.getElementById('upload-msg');

uploadBtn.addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const fileInput = document.getElementById('image');
  const file = fileInput.files[0];

  if (!file || !title) {
    uploadMsg.textContent = "Please provide both title and image.";
    return;
  }

  // Upload file to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('gallery')
    .upload(file.name, file, { cacheControl: '3600', upsert: true });

  if (storageError) {
    uploadMsg.textContent = "Upload error: " + storageError.message;
    return;
  }

  // Get public URL
  const { publicUrl, error: urlError } = supabase.storage
    .from('gallery')
    .getPublicUrl(file.name);

  if (urlError) {
    uploadMsg.textContent = "URL error: " + urlError.message;
    return;
  }

  // Insert record in DB
  const { data: dbData, error: dbError } = await supabase
    .from('portraits')
    .insert([{ title: title, image_url: publicUrl }]);

  if (dbError) {
    uploadMsg.textContent = "DB error: " + dbError.message;
  } else {
    uploadMsg.textContent = "Upload successful!";
    document.getElementById('title').value = '';
    fileInput.value = '';
  }
});
