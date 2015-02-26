require.config({
    baseUrl: 'js/lib',
    paths: {
        fxpay: 'bower_components/fxpay/dist/fxpay.debug',
    },
    shim: {
        fxpay: {
            exports: 'fxpay',
        }
    }
});

requirejs(['../app']);
