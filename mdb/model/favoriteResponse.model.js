class FavoriteResponse {
    constructor(userid, username, introduction, KD, likes, dislikes, karmaRatio, profile_img_url) {

      this.userid = userid
      this.username = username;
      this.introduction = introduction;
      this.KD = KD;
      this.likes = likes;
      this.dislikes = dislikes;
      this.karmaRatio = karmaRatio;
      this.profile_img_url = profile_img_url;

    }
  

  }
  
  // Export the FavoriteResponse class
  module.exports = FavoriteResponse;
  