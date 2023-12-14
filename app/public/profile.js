fetch("/profile")
    .then((response) => {
        console.log("Profile data fetched successfully");
    })
    .catch((error) => {
        console.log("Error fetching profile data:", error);
    });