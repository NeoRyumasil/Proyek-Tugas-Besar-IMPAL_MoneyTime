window.addEventListener('DOMContentLoaded', function() {
    const discardIcon = document.querySelector('.discard-anim');
    if (discardIcon) {
        discardIcon.style.transform = 'scale(0.2)';
        discardIcon.style.transition = 'transform 0.6s cubic-bezier(0.4, 0.8, 0.4, 1)';
        setTimeout(() => {
            discardIcon.style.transform = 'scale(1)';
        }, 100);
    }
    const registrationBefore = document.querySelector('.registration-before');
    const registrationAfter = document.querySelector('.registration-after');
    if (registrationBefore && registrationAfter) {
        registrationBefore.style.opacity = '1';
        registrationAfter.style.opacity = '0';
        registrationBefore.style.transition = 'opacity 0.6s';
        registrationAfter.style.transition = 'opacity 0.6s';
        setTimeout(() => {
            registrationBefore.style.opacity = '0';
            registrationAfter.style.opacity = '1';
        }, 1000);
    }
});
