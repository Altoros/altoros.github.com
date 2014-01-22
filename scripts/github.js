jQuery.githubUser = function(username, callback) {
   jQuery.getJSON('https://api.github.com/users/'+username+'/repos?callback=?',callback)
}
 
jQuery.fn.loadRepositories = function(username,count) {
    this.html("<span class='repolist'>Querying GitHub for " + username +"'s repositories...</span>");
     
    var target = this;
    $.githubUser(username, function(data) {
        var repos = data.data; // JSON Parsing
        sortByName(repos);    
     
        var list = $('<ul class="repolist"/>');
        target.empty().append(list);
//        $(repos).each(function() {
        var length = count?(count+1):$(repos).length;
        for (var i = 0, l = length; i<l; i++){
//          var _this = this;
          var _this = $(repos)[i];
          var m = moment(_this.updated_at).fromNow();
            if (_this.name != (username.toLowerCase()+'.github.com')) {
                list.append('<li>' + 
                  '<ul class="repo-stats">' + '<li class="language">' + (_this.language?(_this.language):'') + '</li>' + 
                  '<li class="stargazers"><a href="https://github.com/Altoros/'+ _this.name +'/stargazers">' + '<span></span>' + _this.stargazers_count + '</a></li>' + 
                  '<li class="forks"><a href="https://github.com/Altoros/'+ _this.name +'/network">' + '<span></span>' + _this.forks_count + '</a></li>' + 
                  '</ul>' + '<span class="repolist-icon"></span>' + 
                  '<h3 class="repolist-name"><a href="https://github.com/Altoros/'+ _this.name +'">' + _this.name + '</a></h3>' + 
                  '<div class="body"><p>' + _this.description + '</p>' + '<p class="updated-at">Last updated ' + m + '</p></div>' + '</li>');
            }
//        });      
        };      
      });
      
    function sortByName(repos) {
        repos.sort(function(a,b) {
        return a.name - b.name;
       });
    }
};
