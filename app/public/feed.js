let postButton = document.getElementById("submit");
let postInput = document.getElementById("post");
let songInput = document.getElementById("song");
let postsContainer = document.querySelector(".feed-container");

function addPost() {
    let text = postInput.value;

    fetch("/feed", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({ "post": text })
    }).then((response) => {
        if (response.ok) {
            console.log("Post added successfully!");
            displayAllPosts();
        } else {
            console.error("Failed to add post!");
        }
    }).catch((error) => {
        console.error("Error:", error);
    });

    postInput.value = "";
}

function searchSong() {
    let song = songInput.value;

    fetch("/search", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({ "song": song })
    }).then((response) => {
        if (response.ok) {
            console.log(response.body)
        } else {
            console.error("Failed to search song!");
        }
    }).catch((error) => {
        console.error("Error:", error);
    });

}

function displayAllPosts() {
    fetch("/feed").then(response => {
        return response.json();
    }).then(body => {
        clearPostsContainer();
        for (let post of body) {
            let postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        }
    }).catch(error => {
        console.error("Error fetching posts:", error);
    });
}

function createPostElement(post) {
    let postDiv = document.createElement("div");
    postDiv.classList.add("post");
    postDiv.innerHTML = `
        <p><strong>@</strong><strong>${post.spotify_id}</strong></p>
        <p><strong></strong>${post.post}</p>
    `;
    return postDiv;
}

function clearPostsContainer() {
    postsContainer.innerHTML = "";
}

postButton.addEventListener("click", function (){
    addPost()
    searchSong()
});

displayAllPosts();