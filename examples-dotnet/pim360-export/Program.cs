using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace pim360_export
{
    class Program
    {
        static HttpClient httpClient;

        static async Task Main(string[] args)
        {
            var authenticator = new oauth2_2legged.Authenticator();
            var accessToken = await authenticator.Authenticate();

            httpClient = new HttpClient();

            //Setting the Authorization header value as default for all requets with this client
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.access_token);

            //Parameters required for the export
            var liveviewExportParameters = new
            {
                liveviewHdl = "",
                etlTargetHdl = "",
                outputFormat = "xlsx",
                outputFilename = "export.xlsx",
                eicHdl = ""
            };

            var httpRequestMessage = new HttpRequestMessage()
            {
                RequestUri = new Uri("https://example-system.pim360.io/api/etl_queue/activities/export"),
                Method = HttpMethod.Post
            };

            //Sending the reequest
            httpRequestMessage.Content = JsonContent.Create(liveviewExportParameters);
            HttpResponseMessage httpResponse = await httpClient.SendAsync(httpRequestMessage);

            //Getting activity information
            string content = await httpResponse.Content.ReadAsStringAsync();
            var objContent =  JsonSerializer.Deserialize<ExportActivityResponse>(content);

            //Wait for export to complete to get the handle of the file
            var completedActivity = await WaitForExportToComplete(objContent.response.act_handle);
            var activityAttachment = completedActivity.Tasks[0].Attachments[0];

            //Download the specified file from PIM360 and save it to disk
            var file = await getFileFromPim(activityAttachment.Hdl);
            using(var fileStream = File.Create("output.xlsx.zip"))
            {
                file.CopyTo(fileStream);
            }
        }

        /// <summary>
        /// continuously polls an activity in PIM360 until it completes either successfully or unsucessfully
        /// </summary>
        /// <param name="activityHdl">The handle of the activity to poll</param>
        /// <returns>The completed activity</returns>
        static async Task<Activity> WaitForExportToComplete( string activityHdl)
        {
            List<Activity> activities;
            do
            {
                string content = await httpClient.GetStringAsync("https://example-system.pim360.io/api/timeline?hdl=" + activityHdl);
                activities = JsonSerializer.Deserialize<Activity[]>(content).ToList();
                Thread.Sleep(1000);
            }
            while (activities.Count == 0 || activities[0].Status != "Complete");

            return activities[0];       
        }

        /// <summary>
        /// Downloads a file from PIM360
        /// </summary>
        /// <param name="fileHdl">The handle of the file to download</param>
        /// <returns>Stream with the file contents</returns>
        static async Task<Stream> getFileFromPim(string fileHdl)
        {
            return await httpClient.GetStreamAsync("https://example-system.pim360.io/api/file/" + fileHdl);
        }
    }
}
