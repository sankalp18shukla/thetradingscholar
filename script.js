document.addEventListener('DOMContentLoaded', () => {
    const customCursor = document.querySelector('.custom-cursor');

    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    });

    // You might want to hide the custom cursor on elements that have their own cursor styles
    // const interactiveElements = document.querySelectorAll('a, button, input, textarea');
    // interactiveElements.forEach(element => {
    //     element.addEventListener('mouseenter', () => customCursor.style.display = 'none');
    //     element.addEventListener('mouseleave', () => customCursor.style.display = 'block');
    // });
});