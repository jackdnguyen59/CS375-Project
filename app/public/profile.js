fetch("profile")
    .then((response) => {
        console.log("done");
    }).catch((error) => {
        console.log(error);
    });