document.getElementById("themeCheckBox").addEventListener("change", (e)=>{

        if (e.target.checked) {
            document.getElementsByTagName("body")[0].classList.add("light");
            document.getElementsByClassName("circleButton")[0].innerHTML = '<i class="fa-regular fa-moon"></i>';
        } else {
            document.getElementsByTagName("body")[0].classList.remove("light");
            document.getElementsByClassName("circleButton")[0].innerHTML = '<i class="fa-regular fa-lightbulb"></i>';
        }

});