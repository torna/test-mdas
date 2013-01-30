jQuery(document).ready(function() {
    jQuery('#question_type').change(function() {
        var question_type = jQuery(this).val();
        jQuery('.question_types').hide(); // hidding previous
        jQuery('#question_type_'+question_type).show();
    });
    
    jQuery('.add_answer_option').click(function() {
        var answer_type = jQuery(this).attr('data-answer-type');
        var content = jQuery('#'+answer_type+'_item').html();
        content = '<div>'+content+' <a href="javascript:;" onclick="jQuery(this).parent().remove()"><i class="icon-minus-sign"></i> delete</a></div>';
        jQuery(this).before(content);
    });
});