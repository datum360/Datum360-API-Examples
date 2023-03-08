namespace oauth2_3legged.Models
{
    public class User
    {
        /// <summary>
        /// email address of the authenticated user
        /// </summary>
        public string email { get; set; }
        /// <summary>
        /// job title of the authenticated user
        /// </summary>
        public string jobTitle { get; set; }
        /// <summary>
        /// name of the authenticated user
        /// </summary>
        public string name { get; set; }
        /// <summary>
        /// username of the authenticated user
        /// </summary>
        public string username { get; set; }
        /// <summary>
        /// the last modification date of the authenticated user
        /// </summary>
        public string last { get; set; }
        /// <summary>
        /// hdl of the authenticated user
        /// </summary>
        public string hdl { get; set; }
        /// <summary>
        /// id of the authenticated user
        /// </summary>
        public string id { get; set; }
    }
}
