var fs = require('fs');

var csvFile = fs.readFileSync("friend_list.csv","utf8");

var emailTemplate = fs.readFileSync('email_template.html', 'utf8');

var ejs = require('ejs');

var tumblr = require('tumblr.js');

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(/*key*/);

// Authenticate via OAuth
var client = tumblr.createClient({
    // keys
});


function csvParse(csvFile) {

	var contactList = csvFile.split("\n"); // split by each contact
	var headers = contactList.splice(0, 1)[0].split(",");
	var objArray = [];

	for (var i = 0; i < contactList.length-1; i++) {
		var contact = {};
		var info = contactList[i].split(",");

		for (var j = 0; j < info.length; j++) {
			var key = headers[j];
			contact[key] = info[j];
		}

	objArray.push(contact);
	
	}
	return objArray;
}


client.posts('codewithcat.tumblr.com', function(err, blog){
	var latestPosts = [];
	var today = new Date();
    var sevenDaysAgo = today - (7 * 24 * 60 * 60 * 1000);
    var sevenDaysAgoInSecs = sevenDaysAgo/1000;
    var numPosts = blog.posts.length;

    for (var i = 0; i < numPosts; i++) {
		var post = blog.posts[i];

		if (post.timestamp >= sevenDaysAgoInSecs && post.state === "published") {
			latestPosts.push(post);
		}

		if (post.timestamp < sevenDaysAgoInSecs) {
			break;
		}
    }

    var csv_data = csvParse(csvFile);

	csv_data.forEach(function(row){
		firstName = row["firstName"];
		numMonthsSinceContact = row["numMonthsSinceContact"];
		templateCopy = emailTemplate;

		var customizedTemplate = ejs.render(templateCopy, { firstName: firstName,
															numMonthsSinceContact: numMonthsSinceContact,
															latestPosts: latestPosts
		});

        //	templateCopy = templateCopy.replace(/FIRST_NAME/gi, firstName).replace(/NUM_MONTHS_SINCE_CONTACT/gi, numMonthsSinceContact);
		
        sendEmail(firstName, row["emailAddress"], "Catherine", "me@gmail.com", "testing", customizedTemplate);
	});
	
 });


 function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
}
