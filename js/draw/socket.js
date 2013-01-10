window.socket_object = new Object();
window.socket_object = {
    socket_url: 'http://93.116.229.42:8000', // url to socket server
    socket_data: null, // socket object
    initSocket: function() {
        this.socket_data = io.connect(this.socket_url);
        this.socket_data.emit('credentials',{
            'hash': token
        });
        // drawing board objects
        this.socket_data.on('draw', function(data){
            window.client_drawer.doDrawing(data);
        });
        
        // re-draw drawing board
        this.socket_data.on('board_redraw', function(data){
            window.client_drawer.reDrawBoard(data);
        });
    },
    emit: function(ident, object) {
        this.socket_data.emit(ident, object);
    }
}

