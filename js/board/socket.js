window.socket_object = {
//        socket_url: 'http://93.116.229.42:8000', // url to socket server
//        socket_url: 'http://192.168.1.103:8000', // url to socket server
        socket_url: ' http://192.168.1.141:8000', // url to socket server
//        socket_url: 'http://localhost:8000', // url to socket server
    socket_data: null, // socket object
    heartbeat_time: new Date().getTime(),
    init: function() {
        this.socket_data = io.connect(this.socket_url);
        this.socket_data.emit('credentials',{
            'hash': token,
            'date': 'now'
        });
        // when not authorized
        this.socket_data.on('reconnect', function(){
            window.location = window.location.href;
        });
        /******** HISTORY *********/
        // server is asking if there has been an refresh
        this.socket_data.on('refresh_status_request', function(data) {
            this.emit('refresh_status_response', {refresh_status: window.board_manager.is_refresh});
        });
        
        // server is asking for content needed for a client that has refreshed or just entered
        this.socket_data.on('get_refresh_content', function() {
            var board_full_data = window.board_manager.getBoardsFullData();
            this.emit('refresh_content_full', {current_content: board_full_data});
        });
        
        // server send to this client content for refresh
        this.socket_data.on('refresh_content', function(data) {
            clearTimeout(window.board_manager.refresh_timeout_obj);
            console.log('refresh_content received, clearing timeout');
            window.board_manager.setBoardsContent(data);
        });
        
        /******** SYNC *********/
        // server is asking if there has been an refresh
        this.socket_data.on('sync_status', function(data) {
            console.log('sync received');
//            this.emit('refresh_status_response', {refresh_status: window.board_manager.is_refresh});
        });
        /******** HEARTBEAT *********/
        // once in 5 seconds check the connection with server
        setInterval(function() {
            var last_received_ping_time = (new Date().getTime() - window.socket_object.heartbeat_time)/1000; // dividing to 1000 to convert from miliseconds to seconds
            if(last_received_ping_time > 10) { 
                console.log('Lost connection with server. Retrying in 5 seconds.');
            }
            window.socket_object.emit('heartbeat_client');
        }, 5000);
        
        this.socket_data.on('heartbeat_client_ok', function() {
            window.socket_object.heartbeat_time = new Date().getTime();
        });
        
        /******** GRAPHIC BOARD *********/
        // drawing board objects
        this.socket_data.on('draw', function(data) {
            window.client_drawer.doDrawing(data);
        });
        
        // re-draw drawing board
        this.socket_data.on('board_redraw', function(data) {
            window.client_drawer.reDrawBoard(data);
        });
        
        /******** PROGRAMMING *********/
        // on board create
        this.socket_data.on('board_create', function(data) {
            window.board_manager.addBoard(data.board_type, data.board_name, 'socket');
        });
        // on board delete
        this.socket_data.on('wb3_board_delete', function(data) {
            window.board_manager.deleteBoard(data.board_type, 'socket');
        });
        // on tab create
        this.socket_data.on('wb3_tab_create', function(data) {
            window.wb3.createTab(data.unique_id, data.tab_name, 'socket', data.file_name);
        });
        // on tab delete
        this.socket_data.on('wb3_tab_delete', function(data) {
            window.wb3.bindDeleteTabEvent(data.sheet_id, 'socket');
        });
        // on language set
        this.socket_data.on('wb3_set_language', function(data) {
            window.wb3.bindLanguageSwitcher(data.chosen_language, data.mime, data.zone_id, 'socket');
        });
        // on editor change
        this.socket_data.on('wb3_editor_change', function(data) {
            window.wb3.applyHighlighterChange(data);
        });
        // on filename change
        this.socket_data.on('wb3_file_name_change', function(data) {
            window.wb3.renameTab(data.zone_id, data.file_name);
        });
        // on treeview change
        this.socket_data.on('wb3_refresh_treeviewer', function(data) {
            window.wb3.bindTreeviewer();
        });
        // on wp3 redraw
        this.socket_data.on('wp3_redraw', function(data) {
            clearTimeout(window.board_manager.refresh_timeout_obj);
            console.log('wp3_redraw received, clearing timeout');
            window.wb3.applyRedrawBoard(data);
            delete data;
        });
        // teacher tab switch
        this.socket_data.on('wb3_teacher_tab', function(data) {
            window.wb3.teacherTabIndicator(data);
        });
    },
    emit: function(ident, object) {
        this.socket_data.emit(ident, object);
    }
}

