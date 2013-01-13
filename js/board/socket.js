window.socket_object = {
//    socket_url: 'http://93.116.229.42:8000', // url to socket server
    socket_url: 'http://localhost:8000', // url to socket server
    socket_data: null, // socket object
    init: function() {
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
        
        /******** PROGRAMMING *********/
        // on board create
        this.socket_data.on('board_create', function(data){
            window.board_manager.addBoard(data.board_type, data.board_name, 'socket');
        });
        // on board delete
        this.socket_data.on('wb3_board_delete', function(data){
            window.board_manager.deleteBoard(data.board_type, 'socket');
        });
        // on tab create
        this.socket_data.on('wb3_tab_create', function(data){
            window.wb3.createTab(data.unique_id, data.tab_name, 'socket');
        });
        // on tab delete
        this.socket_data.on('wb3_tab_delete', function(data){
            window.wb3.bindDeleteTabEvent(data.sheet_id, 'socket');
        });
        // on language set
        this.socket_data.on('wb3_set_language', function(data){
            window.wb3.bindLanguageSwitcher(data.chosen_language, data.mime, data.zone_id, 'socket');
        });
        // on editor change
        this.socket_data.on('wb3_editor_change', function(data){
            window.wb3.applyHighlighterChange(data);
        });
        // on filename change
        this.socket_data.on('wb3_file_name_change', function(data){
            window.wb3.renameTab(data.zone_id, data.file_name);
        });
    },
    emit: function(ident, object) {
        this.socket_data.emit(ident, object);
    }
}

