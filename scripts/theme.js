// document.getElementById("themeCheckBox")
document.addEventListener("DOMContentLoaded", () => {
  let theme = getCookie("theme");
  let themeCheckbox = document.getElementById("themeCheckBox");

  if (theme === "light") {
    themeCheckbox.checked = true;
    document.body.classList.add("light");
    document.getElementsByClassName("circleButton")[0].innerHTML =
      '<i class="fa-regular fa-moon"></i>';
  } else {
    themeCheckbox.checked = false;
    document.body.classList.remove("light");
    document.getElementsByClassName("circleButton")[0].innerHTML =
      '<i class="fa-regular fa-lightbulb"></i>';
  }

  themeCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.body.classList.add("light");
      document.getElementsByClassName("circleButton")[0].innerHTML =
        '<i class="fa-regular fa-moon"></i>';
      setCookie("theme", "light", 30);
    } else {
      document.body.classList.remove("light");
      document.getElementsByClassName("circleButton")[0].innerHTML =
        '<i class="fa-regular fa-lightbulb"></i>';
      setCookie("theme", "dark", 30);
    }
  });
});

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