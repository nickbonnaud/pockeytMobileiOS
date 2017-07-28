function DeepLinkHandler(data)
{
	console.log("in DeepLinkHandler");

}

function InitSession()
{
    console.log('Trigger InitSession()');

    Branch.initSession().then(function (res) {
        console.log(res);
    }).catch(function (err) {
        console.error(err);
    });
}