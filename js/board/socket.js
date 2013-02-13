window.socket_object = {
//    socket_url: 'http://93.116.229.42:8000', // url to socket server
    socket_url: ' http://192.168.1.141:8000', // url to socket server
//    socket_url: 'http://192.168.1.103:8000', // url to socket server
//    socket_url: 'http://localhost:8000', // url to socket server
    socket_data: null, // socket object
    heartbeat_time: new Date().getTime(),
    init: function() {
        this.socket_data = io.connect(this.socket_url);
        this.socket_data.emit('credentials',{
            'hash': token,
            'date': 'now'
        });
        // when not authorized
        this.socket_data.on('reconnect', function() {
            window.location = window.location.href.replace(/#.*/, '');
        });
        /******** HISTORY *********/
        // server is asking if there has been an refresh
        this.socket_data.on('refresh_status_request', function(data) {
            this.emit('refresh_status_response', {
                refresh_status: window.board_manager.is_refresh
                });
        });
        
        // server is asking for content needed for a client that has refreshed or just entered
        this.socket_data.on('get_refresh_content', function() {
            var board_full_data = window.board_manager.getBoardsFullData();
            this.emit('refresh_content_full', {
                current_content: board_full_data
            });
        });
        
        // server send to this client content for refresh (from other clients)
        this.socket_data.on('refresh_content', function(data) {
            clearTimeout(window.board_manager.refresh_timeout_obj);
            console.log('refresh_content received, clearing timeout');
            window.board_manager.setBoardsContent(data);
        });
        
        // create boards first
        this.socket_data.on('create_boards_history', function(data) {
            clearTimeout(window.board_manager.refresh_timeout_obj);
            console.log('create_boards_history received, clearing timeout');
            window.board_manager.createBoardsFromHistory(data);
            delete data;
        });
        
        // list of users
        this.socket_data.on('friend_list', function(data) {
            window.board_manager.createUserList(data);
        });
        
        /******** SYNC *********/
        // server is asking if there has been an refresh
        this.socket_data.on('sync_status', function(data) {
            console.log('sync received');
        //            this.emit('refresh_status_response', {refresh_status: window.board_manager.is_refresh});
        });
        // teacher switched tab and forces student browser to do it also
        this.socket_data.on('main_tab_switch', function(data) {
            window.board_manager.forceSwitchTab(data);
        });
        
        // teacher forces student browser to compile code
        this.socket_data.on('wb3_execute_to_all', function(data) {
            window.wb3.refreshIframe(data.zone_id, data.file_name);
        });
        
        // mouse click
        this.socket_data.on('click', function(data) {
            window.board_manager.mouseClick(data);
        });
        
        // friend joined
        this.socket_data.on('friend_connected', function(data) {
            window.board_manager.notify(data.f_name+' '+data.l_name +' connected', 'success');
            window.board_manager.createUserList([data]);
        });
        
        // friend left
        this.socket_data.on('friend_left', function(data) {
            window.board_manager.notify(data.f_name+' '+data.l_name +' disconnected', 'info');
            window.board_manager.deleteUser(data.hash);
            console.log('friend left');
        });
        
        // teacher forces student refresh
        this.socket_data.on('teacher_force_refresh', function(data) {
            console.log('teacher force refresh, refreshing...');
            window.board_manager.boardsRedraw();
        });
        
        // teacher forces student refresh
        this.socket_data.on('wb3_editor_content', function(data) {
            window.board_manager.getWb3Editors();
        });
        
        /******** HEARTBEAT *********/
        setInterval(function() {
            var last_received_ping_time = (new Date().getTime() - window.socket_object.heartbeat_time)/1000; // dividing to 1000 to convert from miliseconds to seconds
            var seconds_to_retry = 3;
            if(last_received_ping_time > seconds_to_retry*2) { 
                window.board_manager.notify('Lost connection with server. Retrying in '+seconds_to_retry+' seconds.', 'error');
            //        console.log('Lost connection with server. Retrying in '+seconds_to_retry+' seconds.');
            }
            window.socket_object.emit('heartbeat_client');
        }, 3000);
        
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
        
        // teacher tab switch
        this.socket_data.on('wb1_teacher_tab', function(data) {
            window.learn_draw.teacherTabIndicator(data);
        });
        
        // on tab create
        this.socket_data.on('wb1_tab_create', function(data) {
            window.learn_draw.createTab(data.unique_id, data.tab_name, 'socket', data.file_name);
        });
        
        // on delete tab
        this.socket_data.on('wb1_tab_delete', function(data) {
            window.learn_draw.bindDeleteTabEvent(data.sheet_id, 'socket');
        });
        
        // on filename change
        this.socket_data.on('wb1_file_name_change', function(data) {
            window.learn_draw.renameTab(data.zone_id, data.file_name);
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
        
        /******** PRESENTATION *********/
        
        // on tab create
        this.socket_data.on('wb4_tab_create', function(data) {
            window.wb4.createTab(data.unique_id, data.tab_name, 'socket', data.file_name);
        });
        
        // on tab delete
        this.socket_data.on('wb4_tab_delete', function(data) {
            window.wb4.bindDeleteTabEvent(data.sheet_id, 'socket');
        });
        
        // on slide switch
        this.socket_data.on('slide_switch', function(data) {
            window.wb4.switchSlide(data.slider_position, 'socket');
        });
        
        // on wp4 redraw
        this.socket_data.on('wp4_redraw', function(data) {
            clearTimeout(window.board_manager.refresh_timeout_obj);
            console.log('wp4_redraw received, clearing timeout');
            window.wb4.applyRedrawBoard(data);
            delete data;
        });
        
        /******** LANGUAGES *********/
        
        // on tab create
        this.socket_data.on('wb2_create_text', function(data) {
            window.wb2.createTab(data.unique_id, data.tab_name, 'socket', 'text');
        });
        
        // teacher tab switch
        this.socket_data.on('wb2_teacher_tab', function(data) {
            window.wb2.teacherTabIndicator(data);
        });
        
        /******** TESTS *********/
        
        // teacher sent test
        this.socket_data.on('test_from_teacher', function(data) {
            window.wb5.createTeacherTest(data.test, data.test_name, 'socket');
        });
        
        // send test progress to teacher
        this.socket_data.on('send_test_progress', function(data) {
            window.wb5.sendTestProgress(data.test_hash, 'socket');
        });
        
        // student sent test progress to teacher
        this.socket_data.on('student_test_progress', function(data) {
            window.wb5_teacher.processTestProgress(data, 'socket');
        });
        
        // student finished/unfinished test
        this.socket_data.on('student_finished_test', function(data) {
            window.wb5_teacher.setStudentTestStatus(data, 'socket');
        });
        
        // student finished/unfinished test
        this.socket_data.on('close_test', function(data) {
            window.wb5.deleteTab(data.test_hash, 'socket');
        });
    },
    emit: function(ident, object) {
        this.socket_data.emit(ident, object);
    }
}

