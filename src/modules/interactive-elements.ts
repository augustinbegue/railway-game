function Tabs(tabs: HTMLElement) {
    const tabList = tabs.querySelectorAll(".box-tabs-header a");
    const tabContent = tabs.querySelectorAll(".box-tabs-content");

    tabList.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            tabList.forEach(tab => tab.classList.remove("active"));
            tab.classList.add("active");
            tabContent.forEach(content => content.classList.remove("active"));
            tabContent[index].classList.add("active");
        }
        );
    });
}

function Dropdown(container: HTMLElement) {
    const dropdownToggle = container.querySelector("button");
    const dropdownContent = container.querySelector("div");

    dropdownToggle.addEventListener("click", () => {
        dropdownContent.classList.toggle("active");
    });
}

export const InteractiveElements = {
    Tabs,
    Dropdown
}