function addObject() {
    if($("#objects option").length == 0) {
        return;
    }
    var experience = $('#experience').val();
    if(experience == '') {
        alert('Please fill experince field.');
        return;
    }
    var object_id = $('#objects').val();
    var object_name = $("#objects option:selected").text();
    var opgroup = $('#objects :selected').parent().attr('label');
    var html = '<span class="label label-info" style="margin-left:5px;"><span class="option_id" rel="'+object_id+'" data-optgroup="'+opgroup+'"></span><input type="hidden" value="'+object_id+'" name="object_ids[]"><input type="hidden" value="'+experience+'" name="object_experience[]"><span class="option_text">'+object_name+'</span> <a href="javascript:;" onclick="removeObject(this)"><i class="icon-remove-sign"></i></a></span>';
    $('#objects_containter').append(html);
    $("#objects option[value='"+object_id+"']").remove();
    $('#experience').val('');
}

function removeObject(obj) {
    var option_value = $(obj).parent().find('.option_id').attr('rel');
    var option_text = $(obj).parent().find('.option_text').text();
    var opgroup = $(obj).parent().find('.option_id').attr('data-optgroup');
    jQuery('#objects optgroup[label="'+opgroup+'"]').append('<option value="'+option_value+'">'+option_text+'</option>');
    jQuery(obj).parent().remove();
}