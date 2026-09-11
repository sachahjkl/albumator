namespace "staging" {
  capabilities = ["list-jobs", "parse-job", "read-job", "submit-job"]
}

host_volume "albumator-staging-data" {
  policy = "write"
}
