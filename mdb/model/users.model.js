class User {
    constructor(username, email, password) {

      const currentDate = new Date();
      this.username = username;
      this.email = email;
      this.password = password;
      this.steamID = "";
      this.introduction = "Say something about yourself";
      this.KD = 0;
      this.likes = 0;
      this.dislikes = 0;
      this.karmaRatio = 1;
      this.profile_img_url = "assets/images/no_profile_img.png";
      this.favorite_list = [];
      this.date_created = new Date()
    //   this.token = token;

      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); 
      const day = currentDate.getDate().toString().padStart(2, '0');
      const year = currentDate.getFullYear();

      // Format the date as "mm/dd/yyyy"
      this.date_created = `${month}/${day}/${year}`;
    }
  

  }
  
  // Export the User class
  module.exports = User;
  