console.log("Supabase slideshow loader ready");

const PROJECT_URL = "https://jzxdkemcoyjepjtiryje.supabase.co";
const BUCKET_NAME = "portraits"; 
const USE_SIGNED_URLS = false; 

async function loadSupabaseSlides() {
  const slideshowContainer = document.querySelector(".slideshow-container");
  const dotsContainer = document.querySelector(".dots-container");

  // count how many slides already exist in your HTML
  const existingSlides = document.querySelectorAll(".mySlides").length;

  try {
    // fetch all portrait records from your database
    const { data, error } = await supabase
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn("No slides found in Supabase!");
      return;
    }

    // loop through each record
    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      const slideNumber = existingSlides + index + 1;

      // determine image URL
      let imgUrl;
      if (USE_SIGNED_URLS) {
        // private bucket: generate signed URL
        const { data: signedData, error: signedError } = await supabase
          .storage
          .from(BUCKET_NAME)
          .createSignedUrl(item.image_url, 60); // URL valid for 60 seconds
        if (signedError) {
          console.error("Error generating signed URL:", signedError);
          continue;
        }
        imgUrl = signedData.signedUrl;
      } else {
        // public bucket: build full URL
        imgUrl = `${PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/${item.image_url}`;
      }

      // create slide element
      const newSlide = document.createElement("div");
      newSlide.classList.add("mySlides", "fade");
      newSlide.innerHTML = `
        <div class="numbertext">${slideNumber} / ${existingSlides + data.length}</div>
        <img src="${imgUrl}" style="width:100%">
        <div class="text">${item.title || ""}</div>
      `;
      slideshowContainer.appendChild(newSlide);

      // create dot
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("onclick", `currentSlide(${slideNumber})`);
      dotsContainer.appendChild(dot);
    }

    console.log("Supabase images added to slideshow");
  } catch (err) {
    console.error("Error loading Supabase slideshow:", err.message);
  }
}

// load slides when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadSupabaseSlides();
});

