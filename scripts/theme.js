// document.getElementById("themeCheckBox")
let currentTheme = getCookie("theme") || "time";

document.addEventListener("DOMContentLoaded", () => {
  const themeButton = document.getElementById("themeCheckBox");

  setTheme(currentTheme, themeButton);

  themeButton.addEventListener("click", () => {
    if (currentTheme === "light") currentTheme = "dark";
    else if (currentTheme === "dark") currentTheme = "time";
    else currentTheme = "light";

    setTheme(currentTheme, themeButton);
    setCookie("theme", currentTheme, 30);
  });
  
});


function setTheme(theme, themeCheckbox){
    if (theme === "light") {
    themeCheckbox.setAttribute("value", "dark");
    document.body.classList.add("light");
    document.getElementsByClassName("circleButton")[0].innerHTML =
      '<i class="fa-regular fa-moon"></i>';
  } else if(theme === "dark") {
    themeCheckbox.setAttribute("value", "time");
    document.body.classList.remove("light");
    document.getElementsByClassName("circleButton")[0].innerHTML =
      '<i class="fa-regular fa-clock"></i>';
  }
  else{
    themeCheckbox.setAttribute("value", "light");
    setThemeByTime();
    document.getElementsByClassName("circleButton")[0].innerHTML =
      '<i class="fa-regular fa-lightbulb"></i>';
    
  }
}

function setThemeByTime(){
  let now = new Date();
  let hour = now.getHours();
  if (hour<7||hour>16){
    document.body.classList.remove("light");
  }
  else{
    document.body.classList.add("light");
  }
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}