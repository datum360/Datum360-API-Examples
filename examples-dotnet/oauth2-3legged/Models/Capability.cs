namespace oauth2_3legged.Models
{
    public class Capability
    {
        /// <summary>
        /// The URL of the system being authenticated against
        /// </summary>
        public string systemUrl { get; set; }
        /// <summary>
        /// Array of the capabilities granted to the authenticated user
        /// </summary>
        public string[] capabilities { get; set; }
    }
}
