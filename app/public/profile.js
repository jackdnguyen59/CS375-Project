let followButton = document.getElementById("follow");
let spId = document.getElementById("spotify_id").innerHTML;
let spotify_id = spId.substring(12);
let currentUser = document.getElementById("user").innerHTML;

function followUser() {
    fetch("/follow", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({user: currentUser, following: spotify_id}),
    }).then(response => {
        if (response.status === 200) {
            console.log("Followed");
        }
        else {
            console.log("Bad request: Not followed");
        }
    }).catch(error => {
        console.log(error);
    });
}

if (currentUser === spotify_id) {
    followButton.style.display = 'none';
}
else {
    followButton.style.display = 'block';
}

followButton.addEventListener("click", followUser);

fetch("/profile")
    .then((response) => {
        console.log("Profile data fetched successfully");
    })
    .catch((error) => {
        console.log("Error fetching profile data:", error);
    });