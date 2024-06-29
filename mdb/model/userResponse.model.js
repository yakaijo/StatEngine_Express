class UserResponse {
    constructor(userid, username, steamID, token, favorite_list) {

      this.userid = userid;
      this.username = username;
      this.steamID = steamID
      this.token = token;
      this.favorite_list = favorite_list;
    }
  

  }
  
  // Export the User class
  module.exports = UserResponse;
  