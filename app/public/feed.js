// note: ID's post and posts might be confusing, will review later
let post = document.getElementById("submit");
let table = document.getElementById("posts");

// note: -

function addPost(){
    let text = document.getElementById("post");

    fetch("/feed", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({"post": text.value})

    }).then((response) => {
        console.log(response);
    }).catch((error) => {
        console.log(error);
    })

}

function displayAllPosts() {
    fetch("/feed").then(response => {
        return response.json();
    }).then(body => {
        let postList = Object.values(body);
        
        clearTable(); // this is probably only needed if you have it on button press

        for (const tweet of postList[0]) { // maybe take note of time when posted
            console.log(tweet);
            let row = document.createElement("tr");
            let postText = document.createElement("td");
            let postId = document.createElement("td"); // this would eventually be postAuthor

            postText.textContent = tweet.post;
            postId.textContent = tweet.id;

            row.append(postId);
            row.append(postText);
            table.append(row);
        }
    }).catch(error => {
        console.log(error);
    });
}

function displayYourPosts() {
    //
}

function clearTable() {
    let rowCount = table.rows.length;

    for (let i = rowCount - 1; i >= 0; i--) {
        table.deleteRow(i);
    }
}

post.addEventListener("click", () => {
    addPost();
    displayAllPosts();
});

displayAllPosts();