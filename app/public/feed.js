function addPost(){
    let table = document.getElementById("posts");
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

let post = document.getElementById("submit");

post.onclick = function(){
    addPost();
}

//function displayPosts(){

//}