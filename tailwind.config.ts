export default {
    theme: {
        extend: {
            keyframes: {
                stripes: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '40px 0' },
                },
            },
            animation: {
                stripes: 'stripes 1s linear infinite',
            },
        },
    },
}