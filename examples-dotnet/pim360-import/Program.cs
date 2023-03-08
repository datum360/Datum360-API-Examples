using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace pim360_import
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

            //Creating the form body for the request
            MultipartFormDataContent form = new MultipartFormDataContent();
            //File to import
            var stream = File.Open(Path.Combine(Directory.GetCurrentDirectory(), "../../", "Liveview.xlsx"), FileMode.Open);
            HttpContent content = new StreamContent(stream);
            content.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
            {
                Name = "Liveview.xlsx",
                FileName = "Liveview.xlsx"
            };

            //Parameters for the request
            form.Add(content, "upfile");
            form.Add(new StringContent(""), "eicHdl");
            form.Add(new StringContent(""), "etlSourceHdl");
            form.Add(new StringContent(""), "objectType");
            form.Add(new StringContent(""), "classification");

            //Submit the import activity
            var response = await httpClient.PostAsync("https://example-system.pim360.io/api/etl_queue/activities/wide_import", form);
            var jsonObj = await response.Content.ReadAsStringAsync();
            var objContnet = JsonSerializer.Deserialize<ImportActivityResponse>(jsonObj);
            //wait for the import to finish
            var completedActivity = await WaitForImportToComplete(objContnet.data.etlActHdl);
            Console.WriteLine("Task completd with hdl: " + completedActivity.Hdl);
        }

        /// <summary>
        /// continuously polls an activity in PIM360 until it completes either successfully or unsucessfully
        /// </summary>
        /// <param name="activityHdl">The handle of the activity to poll</param>
        /// <returns>The completed activity</returns>
        static async Task<Activity> WaitForImportToComplete(string activityHdl)
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
    }
}
