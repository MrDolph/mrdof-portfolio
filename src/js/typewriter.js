export function initTypeWriterEffect() {
  const heading = document.querySelector('.bio h2');
  if (!heading) return; // exit early if element not found

  const textLength = heading.textContent.length;

  heading.style.animation = 
    `typing ${textLength / 5}s steps(${textLength}, end), 
     blink-cursor 0.75s step-end infinite`;
}
